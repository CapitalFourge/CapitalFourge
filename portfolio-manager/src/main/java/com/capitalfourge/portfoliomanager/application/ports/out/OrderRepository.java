package com.capitalfourge.portfoliomanager.application.ports.out;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.capitalfourge.portfoliomanager.domain.Order;
import com.capitalfourge.portfoliomanager.domain.OrderStatus;

public interface OrderRepository {

    Order save(Order order);

    Optional<Order> findById(UUID id);

    List<Order> findByPortfolioId(UUID portfolioId);

    List<Order> findByUserId(UUID userId);

    List<Order> findByStatus(OrderStatus status);

    List<Order> findPendingOrdersBySymbol(String symbol);

    void deleteById(UUID id);
}
