package com.capitalfourge.portfoliomanager.infrastructure.adapters.in.graphql;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;

import com.capitalfourge.portfoliomanager.application.services.OrderService;
import com.capitalfourge.portfoliomanager.domain.Order;
import com.capitalfourge.portfoliomanager.domain.OrderType;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class OrderGraphQLController {

    private final OrderService orderService;

    @QueryMapping
    public List<Order> orders(@AuthenticationPrincipal UUID userId) {
        if (userId == null) {
            throw new RuntimeException("User not authenticated");
        }
        return orderService.getUserOrders(userId);
    }

    @QueryMapping
    public List<Order> ordersByPortfolio(@Argument("portfolioId") UUID portfolioId) {
        return orderService.getPortfolioOrders(portfolioId);
    }

    @QueryMapping
    public Order order(@Argument("id") UUID id) {
        return orderService.getUserOrders(null).stream()
                .filter(order -> order.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Order not found"));
    }

    @MutationMapping
    public Order createLimitOrder(
            @Argument("portfolioId") UUID portfolioId,
            @Argument("type") OrderType type,
            @Argument("symbol") String symbol,
            @Argument("targetPrice") Double targetPrice,
            @Argument("quantity") Double quantity,
            @Argument("usdAmount") Double usdAmount,
            @Argument("expiresAt") String expiresAt,
            @AuthenticationPrincipal UUID userId) {

        if (userId == null) {
            throw new RuntimeException("User not authenticated");
        }

        Order order = Order.builder()
                .portfolioId(portfolioId)
                .userId(userId)
                .type(type)
                .symbol(symbol)
                .targetPrice(java.math.BigDecimal.valueOf(targetPrice))
                .quantity(quantity != null ? java.math.BigDecimal.valueOf(quantity) : null)
                .usdAmount(usdAmount != null ? java.math.BigDecimal.valueOf(usdAmount) : null)
                .expiresAt(expiresAt != null ? LocalDateTime.parse(expiresAt) : null)
                .build();

        return orderService.createLimitOrder(order);
    }

    @MutationMapping
    public Order cancelOrder(@Argument("orderId") UUID orderId) {
        return orderService.cancelOrder(orderId);
    }
}
