package com.capitalfourge.portfoliomanager.application.services;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.capitalfourge.portfoliomanager.application.ports.in.PortfolioUseCase;
import com.capitalfourge.portfoliomanager.application.ports.out.MetricRepository;
import com.capitalfourge.portfoliomanager.application.ports.out.OrderRepository;
import com.capitalfourge.portfoliomanager.application.ports.out.PortfolioRepository;
import com.capitalfourge.portfoliomanager.application.ports.out.TransactionRepository;
import com.capitalfourge.portfoliomanager.application.ports.out.UserRepository;
import com.capitalfourge.portfoliomanager.domain.Portfolio;
import com.capitalfourge.portfoliomanager.domain.Position;
import com.capitalfourge.portfoliomanager.domain.Transaction;
import com.capitalfourge.portfoliomanager.domain.TransactionType;
import com.capitalfourge.portfoliomanager.domain.User;
import com.capitalfourge.portfoliomanager.domain.Order;
import com.capitalfourge.portfoliomanager.domain.OrderStatus;
import com.capitalfourge.portfoliomanager.domain.OrderType;
import com.capitalfourge.portfoliomanager.infrastructure.grpc.GrpcFinancialDataClient;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class PortfolioService implements PortfolioUseCase {

    private final PortfolioRepository portfolioRepository;
    private final MetricRepository metricRepository;
    private final TransactionRepository transactionRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final GrpcFinancialDataClient grpcFinancialDataClient;

    @Override
    public Portfolio createPortfolio(Portfolio portfolio) {
        if (portfolio.getId() == null) {
            portfolio.setId(UUID.randomUUID());
        }
        if (portfolio.getPositions() == null) {
            portfolio.setPositions(new ArrayList<>());
        }
        if (portfolio.getTransactions() == null) {
            portfolio.setTransactions(new ArrayList<>());
        }

        portfolio.setCumulativeDeposits(BigDecimal.ZERO);
        portfolio.setCumulativeWithdrawals(BigDecimal.ZERO);
        portfolio.setPerformance(0.0);
        portfolio.setPublic(false);

        if (portfolio.getUserId() != null) {
            metricRepository.recordUserActivity(portfolio.getUserId().toString());
        }

        metricRepository.incrementPortfolioCount();

        return portfolioRepository.save(portfolio);
    }

    @Override
    public Portfolio getPortfolio(UUID id) {
        Portfolio portfolio = portfolioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Portfolio not found"));
        metricRepository.recordUserActivity(portfolio.getUserId().toString());

        refreshPortfolioPrices(portfolio);
        updatePerformance(portfolio);

        return portfolio;
    }

    private void refreshPortfolioPrices(Portfolio portfolio) {
        // Update current prices for all positions
        if (portfolio.getPositions() != null && !portfolio.getPositions().isEmpty()) {
            List<String> symbols = portfolio.getPositions().stream()
                    .map(Position::getSymbol)
                    .distinct()
                    .toList();

            if (!symbols.isEmpty()) {
                Map<String, Double> currentPrices = grpcFinancialDataClient.getBatchPrices(symbols);

                portfolio.getPositions().forEach(position -> {
                    Double price = currentPrices.get(position.getSymbol());
                    if (price != null) {
                        position.setCurrentPrice(BigDecimal.valueOf(price));
                    }
                });
            }
        }
    }

    @Override
    public Portfolio buyAsset(UUID portfolioId, String symbol, BigDecimal quantity, BigDecimal price) {
        Portfolio portfolio = getPortfolio(portfolioId);
        BigDecimal totalCost = price.multiply(quantity);

        // Get user and check global cash balance
        User user = userRepository.findById(portfolio.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        BigDecimal userCashBalance = user.getCashBalance() != null ? user.getCashBalance() : BigDecimal.ZERO;

        if (userCashBalance.compareTo(totalCost) < 0) {
            throw new RuntimeException("Insufficient balance for trade");
        }

        // Deduct from user's global cash balance
        user.setCashBalance(userCashBalance.subtract(totalCost));
        userRepository.save(user);

        // Update portfolio positions
        Optional<Position> existing = portfolio.getPositions()
                .stream().filter(p -> p.getSymbol().equals(symbol)).findFirst();
        if (existing.isPresent()) {
            Position pos = existing.get();
            BigDecimal newQty = pos.getQuantity().add(quantity);
            BigDecimal totalSpent = pos.getQuantity()
                    .multiply(pos.getAveragePurchasePrice()).add(totalCost);
            pos.setAveragePurchasePrice(totalSpent.divide(newQty, 8, RoundingMode.HALF_UP));
            pos.setQuantity(newQty);
        } else {
            portfolio.getPositions().add(Position.builder()
                    .id(UUID.randomUUID())
                    .portfolioId(portfolioId)
                    .symbol(symbol)
                    .quantity(quantity)
                    .averagePurchasePrice(price)
                    .currentPrice(price)
                    .build());
        }

        Transaction transaction = Transaction.builder()
                .id(UUID.randomUUID()).portfolioId(portfolioId).type(TransactionType.BUY)
                .symbol(symbol).quantity(quantity).price(price)
                .totalAmount(totalCost).timestamp(LocalDateTime.now())
                .balanceTransaction(user.getCashBalance()).build();

        transactionRepository.save(transaction);
        portfolio.getTransactions().add(transaction);

        // Implicitly fund the portfolio from global cash for performance tracking
        portfolio.setCumulativeDeposits(portfolio.getCumulativeDeposits().add(totalCost));

        metricRepository.incrementAssetVolume(symbol, quantity.doubleValue());
        updatePerformance(portfolio);

        return portfolioRepository.save(portfolio);
    }

    @Override
    public Portfolio sellAsset(UUID portfolioId, String symbol, BigDecimal quantity, BigDecimal price) {
        Portfolio portfolio = getPortfolio(portfolioId);
        Position pos = portfolio.getPositions().stream()
                .filter(p -> p.getSymbol().equals(symbol)).findFirst()
                .orElseThrow(() -> new RuntimeException("Symbol not found in portfolio"));
        if (pos.getQuantity().compareTo(quantity) < 0) {
            throw new RuntimeException("Not enough assets to sell");
        }
        BigDecimal totalAmount = price.multiply(quantity);

        // Get user and add to global cash balance
        User user = userRepository.findById(portfolio.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        BigDecimal userCashBalance = user.getCashBalance() != null ? user.getCashBalance() : BigDecimal.ZERO;
        user.setCashBalance(userCashBalance.add(totalAmount));
        userRepository.save(user);

        // Update portfolio positions
        pos.setQuantity(pos.getQuantity().subtract(quantity));
        if (pos.getQuantity().compareTo(BigDecimal.ZERO) == 0) {
            portfolio.getPositions().remove(pos);
        }

        Transaction transaction = Transaction.builder()
                .id(UUID.randomUUID()).portfolioId(portfolioId).type(TransactionType.SELL)
                .symbol(symbol).quantity(quantity).price(price)
                .totalAmount(totalAmount).timestamp(LocalDateTime.now())
                .balanceTransaction(user.getCashBalance()).build();

        transactionRepository.save(transaction);
        portfolio.getTransactions().add(transaction);

        // Implicitly withdraw funds from the portfolio to global cash for performance
        // tracking
        portfolio.setCumulativeWithdrawals(portfolio.getCumulativeWithdrawals().add(totalAmount));

        metricRepository.incrementAssetVolume(symbol, quantity.doubleValue());
        updatePerformance(portfolio);

        return portfolioRepository.save(portfolio);
    }

    @Override
    public Portfolio addCash(UUID portfolioId, BigDecimal amount) {
        Portfolio portfolio = getPortfolio(portfolioId);

        // Get user and add to global cash balance
        User user = userRepository.findById(portfolio.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        BigDecimal userCashBalance = user.getCashBalance() != null ? user.getCashBalance() : BigDecimal.ZERO;
        System.out.println("💰 [addCash] BEFORE - User ID: " + user.getId() + ", Cash Balance: " + userCashBalance);
        System.out.println("💰 [addCash] Depositing amount: " + amount);

        user.setCashBalance(userCashBalance.add(amount));
        userRepository.save(user);

        System.out.println("💰 [addCash] AFTER - User Cash Balance: " + user.getCashBalance());

        // Update portfolio cumulative deposits
        portfolio.setCumulativeDeposits(portfolio.getCumulativeDeposits().add(amount));

        Transaction transaction = Transaction.builder()
                .id(UUID.randomUUID()).portfolioId(portfolioId).type(TransactionType.DEPOSIT).symbol("USD")
                .quantity(BigDecimal.ONE).price(amount)
                .totalAmount(amount).timestamp(LocalDateTime.now())
                .balanceTransaction(user.getCashBalance()).build();

        transactionRepository.save(transaction);
        portfolio.getTransactions().add(transaction);

        updatePerformance(portfolio);
        return portfolioRepository.save(portfolio);
    }

    @Override
    public Portfolio withdrawCash(UUID portfolioId, BigDecimal amount) {
        Portfolio portfolio = getPortfolio(portfolioId);

        // Get user and check global cash balance
        User user = userRepository.findById(portfolio.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        BigDecimal userCashBalance = user.getCashBalance() != null ? user.getCashBalance() : BigDecimal.ZERO;

        if (userCashBalance.compareTo(amount) < 0) {
            throw new RuntimeException("Insufficient cash balance");
        }

        // Deduct from user's global cash balance
        user.setCashBalance(userCashBalance.subtract(amount));
        userRepository.save(user);

        // Update portfolio cumulative withdrawals
        portfolio.setCumulativeWithdrawals(portfolio.getCumulativeWithdrawals().add(amount));

        Transaction transaction = Transaction.builder()
                .id(UUID.randomUUID()).portfolioId(portfolioId).type(TransactionType.WITHDRAWAL).symbol("USD")
                .quantity(BigDecimal.ONE).price(amount)
                .totalAmount(amount).timestamp(LocalDateTime.now())
                .balanceTransaction(user.getCashBalance()).build();

        transactionRepository.save(transaction);
        portfolio.getTransactions().add(transaction);
        return portfolioRepository.save(portfolio);
    }

    @Override
    public List<Portfolio> getPortfoliosByUser(UUID userId) {
        List<Portfolio> portfolios = portfolioRepository.findByUserId(userId);
        portfolios.forEach(portfolio -> {
            refreshPortfolioPrices(portfolio);
            updatePerformance(portfolio);
        });
        return portfolios;
    }

    @Override
    public void deletePortfolio(UUID id) {
        Portfolio portfolio = portfolioRepository.findById(id).orElse(null);
        if (portfolio == null)
            return;

        // 1. Get all orders for this portfolio and cancel pending ones
        List<Order> orders = orderRepository.findByPortfolioId(id);
        User user = userRepository.findById(portfolio.getUserId()).orElse(null);

        if (user != null) {
            for (Order order : orders) {
                if (order.getStatus() == OrderStatus.PENDING) {
                    BigDecimal amountToReturn = BigDecimal.ZERO;
                    if (order.getType() == OrderType.BUY_LIMIT) {
                        amountToReturn = order.getUsdAmount() != null ? order.getUsdAmount()
                                : order.getQuantity().multiply(order.getTargetPrice());

                        user.setCashBalance(user.getCashBalance().add(amountToReturn));
                        user.setLockedBalance(user.getLockedBalance().subtract(amountToReturn));
                    }
                    order.setStatus(OrderStatus.CANCELLED);
                    orderRepository.save(order);
                }
            }
            userRepository.save(user);
        }

        // 2. Delete the portfolio (cascade will handle positions/transactions)
        portfolioRepository.deleteById(id);
    }

    public Portfolio buyAssetByUSD(UUID portfolioId, String symbol, BigDecimal usdAmount, BigDecimal price) {
        BigDecimal quantity = usdAmount.divide(price, 8, RoundingMode.DOWN);
        return buyAsset(portfolioId, symbol, quantity, price);
    }

    public Portfolio sellAssetByUSD(UUID portfolioId, String symbol, BigDecimal usdAmount, BigDecimal price) {
        BigDecimal quantity = usdAmount.divide(price, 8, RoundingMode.UP);
        return sellAsset(portfolioId, symbol, quantity, price);
    }

    @Override
    public void repairUserBalance(UUID userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null)
            return;

        List<Order> userOrders = orderRepository.findByUserId(userId);

        // 1. Identify and cancel orders for deleted portfolios
        BigDecimal recoveredBalance = BigDecimal.ZERO;
        for (Order order : userOrders) {
            if (order.getStatus() == OrderStatus.PENDING) {
                boolean portfolioExists = portfolioRepository.findById(order.getPortfolioId()).isPresent();
                if (!portfolioExists) {
                    // This is an orphan!
                    BigDecimal amount = order.getUsdAmount() != null ? order.getUsdAmount()
                            : order.getQuantity().multiply(order.getTargetPrice());
                    recoveredBalance = recoveredBalance.add(amount);
                    order.setStatus(OrderStatus.CANCELLED);
                    orderRepository.save(order);
                    log.info("Recovered {} from orphaned order {} for user {}", amount, order.getId(), userId);
                }
            }
        }

        if (recoveredBalance.compareTo(BigDecimal.ZERO) > 0) {
            user.setCashBalance((user.getCashBalance() != null ? user.getCashBalance() : BigDecimal.ZERO)
                    .add(recoveredBalance));
            user.setLockedBalance((user.getLockedBalance() != null ? user.getLockedBalance() : BigDecimal.ZERO)
                    .subtract(recoveredBalance));
            userRepository.save(user);
        }

        // 2. Extra safety: Recalculate locked balance based on ALL remaining PENDING
        // orders
        List<Order> remainingPending = orderRepository.findByUserId(userId).stream()
                .filter(o -> o.getStatus() == OrderStatus.PENDING && o.getType() == OrderType.BUY_LIMIT)
                .toList();

        BigDecimal actualLocked = remainingPending.stream()
                .map(o -> o.getUsdAmount() != null ? o.getUsdAmount() : o.getQuantity().multiply(o.getTargetPrice()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal currentLocked = user.getLockedBalance() != null ? user.getLockedBalance() : BigDecimal.ZERO;

        if (currentLocked.compareTo(actualLocked) != 0) {
            log.warn("Balance mismatch detected for user {}. DB Locked: {}, Actual Orders: {}",
                    userId, currentLocked, actualLocked);
            // We prioritize the actual orders as the source of truth for "locked"
            BigDecimal diff = currentLocked.subtract(actualLocked);
            user.setLockedBalance(actualLocked);
            user.setCashBalance((user.getCashBalance() != null ? user.getCashBalance() : BigDecimal.ZERO).add(diff));
            userRepository.save(user);
        }
    }

    private void updatePerformance(Portfolio portfolio) {
        double currentVal = portfolio.getTotalAccountValue().doubleValue();
        double totalIn = portfolio.getCumulativeDeposits().doubleValue();
        double totalOut = portfolio.getCumulativeWithdrawals().doubleValue();
        double profit = (currentVal + totalOut) - totalIn;
        double roi = (totalIn > 0) ? (profit / totalIn) * 100 : 0;

        portfolio.setPerformance(roi);
        metricRepository.updatePortfolioPerformance(portfolio.getId().toString(), roi);
    }

    @Override
    public Portfolio toggleVisibility(UUID portfolioId, boolean isPublic) {
        Portfolio portfolio = portfolioRepository.findById(portfolioId)
                .orElseThrow(() -> new RuntimeException("Portfolio not found"));

        portfolio.setPublic(isPublic);
        if (isPublic && (portfolio.getShareSlug() == null || portfolio.getShareSlug().isEmpty())) {
            // Generate a unique slug based on portfolio name and a fragment of UUID
            String base = portfolio.getName().toLowerCase().replaceAll("[^a-z0-9]", "-");
            String slug = base + "-" + UUID.randomUUID().toString().substring(0, 8);
            portfolio.setShareSlug(slug);
        }

        return portfolioRepository.save(portfolio);
    }

    @Override
    public List<Portfolio> getPublicLeaderboard() {
        List<Portfolio> topPortfolios = portfolioRepository.findPublicPortfolios();
        // Ensure prices are fresh for the leaderboard
        topPortfolios.forEach(p -> {
            refreshPortfolioPrices(p);
            updatePerformance(p);
        });
        // Sort again in case ROI changed after refresh
        return topPortfolios.stream()
                .sorted((p1, p2) -> Double.compare(p2.getPerformance(), p1.getPerformance()))
                .limit(20)
                .toList();
    }

    @Override
    public Portfolio getPortfolioBySlug(String slug) {
        Portfolio portfolio = portfolioRepository.findByShareSlug(slug)
                .orElseThrow(() -> new RuntimeException("Portfolio shared correctly not found or link expired"));

        if (!portfolio.isPublic()) {
            throw new RuntimeException("This portfolio is no longer public.");
        }

        refreshPortfolioPrices(portfolio);
        updatePerformance(portfolio);
        return portfolio;
    }
}
