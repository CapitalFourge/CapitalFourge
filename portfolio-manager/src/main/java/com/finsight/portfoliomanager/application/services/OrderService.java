package com.finsight.portfoliomanager.application.services;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.Optional;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.finsight.portfoliomanager.application.ports.in.PortfolioUseCase;
import com.finsight.portfoliomanager.application.ports.out.MetricRepository;
import com.finsight.portfoliomanager.application.ports.out.OrderRepository;
import com.finsight.portfoliomanager.application.ports.out.PortfolioRepository;
import com.finsight.portfoliomanager.application.ports.out.UserRepository;
import com.finsight.portfoliomanager.domain.Order;
import com.finsight.portfoliomanager.domain.OrderType;
import com.finsight.portfoliomanager.domain.Portfolio;
import com.finsight.portfoliomanager.domain.Position;
import com.finsight.portfoliomanager.domain.User;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final PortfolioUseCase portfolioUseCase;
    private final PortfolioRepository portfolioRepository;
    private final UserRepository userRepository;
    private final UserRepository userRepository;
    private final RedisTemplate<String, String> redisTemplate;

    @Transactional
    public Order createLimitOrder(Order order) {
        // Validate order
        if (order.getTargetPrice() == null || order.getTargetPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Target price must be positive");
        }

        if (order.getQuantity() == null && order.getUsdAmount() == null) {
            throw new IllegalArgumentException("Either quantity or USD amount must be specified");
        }

        if (order.getQuantity() != null && order.getQuantity().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Quantity must be positive");
        }

        if (order.getUsdAmount() != null && order.getUsdAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("USD amount must be positive");
        }

        // Get portfolio for balance/position operations
        Portfolio portfolio = portfolioRepository.findById(order.getPortfolioId())
                .orElseThrow(() -> new IllegalArgumentException("Portfolio not found"));

        // Calculate order amount
        BigDecimal orderAmount;
        if (order.getUsdAmount() != null) {
            orderAmount = order.getUsdAmount();
        } else {
            orderAmount = order.getQuantity().multiply(order.getTargetPrice());
        }

        // Handle BUY_LIMIT: deduct cash from user's global cash balance
        if (order.getType() == OrderType.BUY_LIMIT) {
            User user = userRepository.findById(portfolio.getUserId())
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));
            BigDecimal userCashBalance = user.getCashBalance() != null ? user.getCashBalance() : BigDecimal.ZERO;

            if (userCashBalance.compareTo(orderAmount) < 0) {
                throw new IllegalArgumentException("Insufficient balance for buy order");
            }
            user.setCashBalance(userCashBalance.subtract(orderAmount));
            userRepository.save(user);
            log.info("Deducted {} from user {} balance for buy order", orderAmount, portfolio.getUserId());
        } // Handle SELL_LIMIT: lock quantity in position
        else if (order.getType() == OrderType.SELL_LIMIT) {
            BigDecimal quantityToLock = order.getQuantity() != null
                    ? order.getQuantity()
                    : order.getUsdAmount().divide(order.getTargetPrice(), 8, RoundingMode.UP);

            Optional<Position> positionOpt = portfolio.getPositions().stream()
                    .filter(p -> p.getSymbol().equals(order.getSymbol()))
                    .findFirst();

            if (positionOpt.isEmpty()) {
                throw new IllegalArgumentException("Position not found for sell order");
            }

            Position position = positionOpt.get();
            BigDecimal availableQuantity = position.getAvailableQuantity();

            if (availableQuantity.compareTo(quantityToLock) < 0) {
                throw new IllegalArgumentException("Insufficient available quantity for sell order");
            }

            // Lock the quantity
            BigDecimal currentLocked = position.getLockedQuantity() != null ? position.getLockedQuantity()
                    : BigDecimal.ZERO;
            position.setLockedQuantity(currentLocked.add(quantityToLock));
            portfolioRepository.save(portfolio);
            log.info("Locked {} of {} in portfolio {} for sell order", quantityToLock, order.getSymbol(),
                    order.getPortfolioId());
        }

        // Set default expiration (30 days)
        if (order.getExpiresAt() == null) {
            order.setExpiresAt(LocalDateTime.now().plusDays(30));
        }

        // Set initial status
        order.setStatus(OrderStatus.PENDING);
        order.setCreatedAt(LocalDateTime.now());

        // Save order
        Order savedOrder = orderRepository.save(order);

        // Publish to Redis for price monitoring
        publishOrderCreated(savedOrder);

        log.info("Created limit order: {} for symbol: {} at price: {}",
                savedOrder.getId(), savedOrder.getSymbol(), savedOrder.getTargetPrice());

        return savedOrder;
    }

    @Transactional
    public Order cancelOrder(UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new IllegalStateException("Only pending orders can be cancelled");
        }

        // Get portfolio for balance/position operations
        Portfolio portfolio = portfolioRepository.findById(order.getPortfolioId())
                .orElseThrow(() -> new IllegalArgumentException("Portfolio not found"));

        // Calculate order amount
        BigDecimal orderAmount;
        if (order.getUsdAmount() != null) {
            orderAmount = order.getUsdAmount();
        } else {
            orderAmount = order.getQuantity().multiply(order.getTargetPrice());
        }

        // Handle BUY_LIMIT: return cash to user's global cash balance
        if (order.getType() == OrderType.BUY_LIMIT) {
            User user = userRepository.findById(portfolio.getUserId())
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));
            BigDecimal userCashBalance = user.getCashBalance() != null ? user.getCashBalance() : BigDecimal.ZERO;
            user.setCashBalance(userCashBalance.add(orderAmount));
            userRepository.save(user);
            log.info("Returned {} to user {} balance for cancelled buy order", orderAmount, portfolio.getUserId());
        } // Handle SELL_LIMIT: unlock quantity in position
        else if (order.getType() == OrderType.SELL_LIMIT) {
            BigDecimal quantityToUnlock = order.getQuantity() != null
                    ? order.getQuantity()
                    : order.getUsdAmount().divide(order.getTargetPrice(), 8, RoundingMode.UP);

            Optional<Position> positionOpt = portfolio.getPositions().stream()
                    .filter(p -> p.getSymbol().equals(order.getSymbol()))
                    .findFirst();

            if (positionOpt.isPresent()) {
                Position position = positionOpt.get();
                BigDecimal currentLocked = position.getLockedQuantity() != null ? position.getLockedQuantity()
                        : BigDecimal.ZERO;
                position.setLockedQuantity(currentLocked.subtract(quantityToUnlock));
                portfolioRepository.save(portfolio);
                log.info("Unlocked {} of {} in portfolio {} for cancelled sell order", quantityToUnlock,
                        order.getSymbol(), order.getPortfolioId());
            }
        }

        order.setStatus(OrderStatus.CANCELLED);
        Order savedOrder = orderRepository.save(order);

        // Publish cancellation event
        publishOrderCancelled(savedOrder);

        log.info("Cancelled order: {}", orderId);
        return savedOrder;
    }

    public List<Order> getUserOrders(UUID userId) {
        return orderRepository.findByUserId(userId);
    }

    public List<Order> getPortfolioOrders(UUID portfolioId) {
        return orderRepository.findByPortfolioId(portfolioId);
    }

    @Transactional
    public void executeOrder(UUID orderId, BigDecimal currentPrice) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (order.getStatus() != OrderStatus.PENDING) {
            log.warn("Order {} is not pending, skipping execution", orderId);
            return;
        }

        // Check if order is expired
        if (LocalDateTime.now().isAfter(order.getExpiresAt())) {
            order.setStatus(OrderStatus.EXPIRED);
            orderRepository.save(order);

            // For expired orders, return locked resources
            restoreLockedResources(order);

            log.info("Order {} has expired", orderId);
            return;
        }

        // Check if price condition is met
        if (!shouldExecute(order, currentPrice)) {
            log.debug("Order {} price condition not met. Target: {}, Current: {}",
                    orderId, order.getTargetPrice(), currentPrice);
            return;
        }

        // Execute trade via PortfolioService
        try {
            if (order.getType() == OrderType.BUY_LIMIT) {
                Portfolio portfolio_ref = portfolioRepository.findById(order.getPortfolioId())
                        .orElseThrow(() -> new IllegalArgumentException("Portfolio not found"));
                User user_ref = userRepository.findById(portfolio_ref.getUserId())
                        .orElseThrow(() -> new IllegalArgumentException("User not found"));
                BigDecimal reserved = order.getUsdAmount() != null ? order.getUsdAmount()
                        : order.getQuantity().multiply(order.getTargetPrice());
                user_ref.setCashBalance(
                        (user_ref.getCashBalance() != null ? user_ref.getCashBalance() : BigDecimal.ZERO)
                                .add(reserved));
                userRepository.save(user_ref);
                if (order.getQuantity() != null) {
                    portfolioUseCase.buyAsset(order.getPortfolioId(), order.getSymbol(),
                            order.getQuantity(), currentPrice);
                } else if (order.getUsdAmount() != null) {
                    BigDecimal quantity = order.getUsdAmount().divide(currentPrice, 8, RoundingMode.DOWN);
                    portfolioUseCase.buyAsset(order.getPortfolioId(), order.getSymbol(),
                            quantity, currentPrice);
                }
            } else if (order.getType() == OrderType.SELL_LIMIT) {
                if (order.getQuantity() != null) {
                    portfolioUseCase.sellAsset(order.getPortfolioId(), order.getSymbol(),
                            order.getQuantity(), currentPrice);
                } else if (order.getUsdAmount() != null) {
                    BigDecimal quantity = order.getUsdAmount().divide(currentPrice, 8, RoundingMode.UP);
                    portfolioUseCase.sellAsset(order.getPortfolioId(), order.getSymbol(),
                            quantity, currentPrice);
                }

                // Unlock the locked quantity for sell orders
                unlockQuantityForSellOrder(order);
            }

            // Update order status to FILLED
            order.setStatus(OrderStatus.FILLED);
            order.setFilledAt(LocalDateTime.now());
            order.setFilledPrice(currentPrice);
            order.setFilledQuantity(order.getQuantity() != null ? order.getQuantity()
                    : order.getUsdAmount().divide(currentPrice, 8, RoundingMode.DOWN));

            Order savedOrder = orderRepository.save(order);

            // Publish order filled event
            publishOrderFilled(savedOrder);

            log.info("Executed order {} at price {}", orderId, currentPrice);

        } catch (Exception e) {
            log.error("Failed to execute order {}: {}", orderId, e.getMessage());
            order.setStatus(OrderStatus.REJECTED);
            order.setRejectionReason(e.getMessage());
            orderRepository.save(order);

            // Restore locked resources on rejection
            restoreLockedResources(order);
        }
    }

    private void restoreLockedResources(Order order) {
        Portfolio portfolio = portfolioRepository.findById(order.getPortfolioId())
                .orElseThrow(() -> new IllegalArgumentException("Portfolio not found"));

        // Handle BUY_LIMIT: return cash to user's global cash balance
        if (order.getType() == OrderType.BUY_LIMIT) {
            BigDecimal orderAmount = order.getUsdAmount() != null
                    ? order.getUsdAmount()
                    : order.getQuantity().multiply(order.getTargetPrice());
            User user = userRepository.findById(portfolio.getUserId())
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));
            BigDecimal userCashBalance = user.getCashBalance() != null ? user.getCashBalance() : BigDecimal.ZERO;
            user.setCashBalance(userCashBalance.add(orderAmount));
            userRepository.save(user);
            log.info("Returned {} to user {} balance for expired/rejected buy order", orderAmount,
                    portfolio.getUserId());
        } // Handle SELL_LIMIT: unlock quantity in position
        else if (order.getType() == OrderType.SELL_LIMIT) {
            unlockQuantityForSellOrder(order);
        }
    }

    private void unlockQuantityForSellOrder(Order order) {
        Portfolio portfolio = portfolioRepository.findById(order.getPortfolioId())
                .orElseThrow(() -> new IllegalArgumentException("Portfolio not found"));

        BigDecimal quantityToUnlock = order.getQuantity() != null
                ? order.getQuantity()
                : order.getUsdAmount().divide(order.getTargetPrice(), 8, RoundingMode.UP);

        Optional<Position> positionOpt = portfolio.getPositions().stream()
                .filter(p -> p.getSymbol().equals(order.getSymbol()))
                .findFirst();

        if (positionOpt.isPresent()) {
            Position position = positionOpt.get();
            BigDecimal currentLocked = position.getLockedQuantity() != null ? position.getLockedQuantity()
                    : BigDecimal.ZERO;
            position.setLockedQuantity(currentLocked.subtract(quantityToUnlock));
            portfolioRepository.save(portfolio);
            log.info("Unlocked {} of {} in portfolio {} for filled sell order", quantityToUnlock, order.getSymbol(),
                    order.getPortfolioId());
        }
    }

    private boolean shouldExecute(Order order, BigDecimal currentPrice) {
        // For BUY_LIMIT: currentPrice <= targetPrice
        // For SELL_LIMIT: currentPrice >= targetPrice
        if (order.getType() == OrderType.BUY_LIMIT) {
            return currentPrice.compareTo(order.getTargetPrice()) <= 0;
        } else {
            return currentPrice.compareTo(order.getTargetPrice()) >= 0;
        }
    }

    private void publishOrderCreated(Order order) {
        try {
            String message = String.format("{\"orderId\":\"%s\",\"symbol\":\"%s\",\"type\":\"%s\",\"status\":\"%s\"}",
                    order.getId(), order.getSymbol(), order.getType(), order.getStatus());
            redisTemplate.convertAndSend("order_events", message);
        } catch (Exception e) {
            log.error("Failed to publish order created event: {}", e.getMessage());
        }
    }

    private void publishOrderCancelled(Order order) {
        try {
            String message = String.format("{\"orderId\":\"%s\",\"symbol\":\"%s\",\"type\":\"%s\",\"status\":\"%s\"}",
                    order.getId(), order.getSymbol(), order.getType(), order.getStatus());
            redisTemplate.convertAndSend("order_events", message);
        } catch (Exception e) {
            log.error("Failed to publish order cancelled event: {}", e.getMessage());
        }
    }

    private void publishOrderFilled(Order order) {
        try {
            String message = String.format(
                    "{\"orderId\":\"%s\",\"symbol\":\"%s\",\"type\":\"%s\",\"status\":\"%s\",\"filledPrice\":\"%s\"}",
                    order.getId(), order.getSymbol(), order.getType(), order.getStatus(), order.getFilledPrice());
            redisTemplate.convertAndSend("order_events", message);
        } catch (Exception e) {
            log.error("Failed to publish order filled event: {}", e.getMessage());
        }
    }
}
