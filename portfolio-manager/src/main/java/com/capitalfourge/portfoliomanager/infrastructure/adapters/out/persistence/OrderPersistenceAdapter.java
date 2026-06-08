package com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.capitalfourge.portfoliomanager.application.ports.out.OrderRepository;
import com.capitalfourge.portfoliomanager.domain.Order;
import com.capitalfourge.portfoliomanager.domain.OrderStatus;
import com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence.Entities.OrderEntity;
import com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence.Repositories.JpaOrderRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class OrderPersistenceAdapter implements OrderRepository {

    private final JpaOrderRepository jpaRepository;

    @Override
    public Order save(Order order) {
        OrderEntity entity = toEntity(order);
        OrderEntity savedEntity = jpaRepository.save(entity);
        return toDomain(savedEntity);
    }

    @Override
    public Optional<Order> findById(UUID id) {
        return jpaRepository.findById(id).map(this::toDomain);
    }

    @Override
    public List<Order> findByPortfolioId(UUID portfolioId) {
        return jpaRepository.findByPortfolioId(portfolioId).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<Order> findByUserId(UUID userId) {
        return jpaRepository.findByUserId(userId).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<Order> findByStatus(OrderStatus status) {
        return jpaRepository.findByStatus(status.name()).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<Order> findPendingOrdersBySymbol(String symbol) {
        return jpaRepository.findByStatusAndSymbol("PENDING", symbol).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteById(UUID id) {
        jpaRepository.deleteById(id);
    }

    private OrderEntity toEntity(Order order) {
        return OrderEntity.builder()
                .id(order.getId())
                .portfolioId(order.getPortfolioId())
                .userId(order.getUserId())
                .type(order.getType())
                .symbol(order.getSymbol())
                .targetPrice(order.getTargetPrice())
                .quantity(order.getQuantity())
                .usdAmount(order.getUsdAmount())
                .status(order.getStatus())
                .createdAt(order.getCreatedAt())
                .filledAt(order.getFilledAt())
                .expiresAt(order.getExpiresAt())
                .filledPrice(order.getFilledPrice())
                .filledQuantity(order.getFilledQuantity())
                .rejectionReason(order.getRejectionReason())
                .build();
    }

    private Order toDomain(OrderEntity entity) {
        return Order.builder()
                .id(entity.getId())
                .portfolioId(entity.getPortfolioId())
                .userId(entity.getUserId())
                .type(entity.getType())
                .symbol(entity.getSymbol())
                .targetPrice(entity.getTargetPrice())
                .quantity(entity.getQuantity())
                .usdAmount(entity.getUsdAmount())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .filledAt(entity.getFilledAt())
                .expiresAt(entity.getExpiresAt())
                .filledPrice(entity.getFilledPrice())
                .filledQuantity(entity.getFilledQuantity())
                .rejectionReason(entity.getRejectionReason())
                .build();
    }
}
