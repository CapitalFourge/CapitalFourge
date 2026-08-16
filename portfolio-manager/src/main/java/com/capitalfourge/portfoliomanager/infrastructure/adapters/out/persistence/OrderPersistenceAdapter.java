package com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

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
    @Transactional
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
    public Page<Order> findByPortfolioId(UUID portfolioId, Pageable pageable) {
        return jpaRepository.findByPortfolioId(portfolioId, pageable).map(this::toDomain);
    }

    @Override
    public Page<Order> findByUserId(UUID userId, Pageable pageable) {
        return jpaRepository.findByUserId(userId, pageable).map(this::toDomain);
    }

    @Override
    public Page<Order> findByStatus(OrderStatus status, Pageable pageable) {
        return jpaRepository.findByStatus(status.name(), pageable).map(this::toDomain);
    }

    @Override
    public List<Order> findByPortfolioId(UUID portfolioId) {
        return jpaRepository.findByPortfolioId(portfolioId, org.springframework.data.domain.Pageable.unpaged()).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<Order> findByUserId(UUID userId) {
        return jpaRepository.findByUserId(userId, org.springframework.data.domain.Pageable.unpaged()).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<Order> findByStatus(OrderStatus status) {
        return jpaRepository.findByStatus(status.name(), org.springframework.data.domain.Pageable.unpaged()).stream()
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
    @Transactional
    public void deleteById(UUID id) {
        jpaRepository.deleteById(id);
    }

    @Override
    @Transactional
    public List<Order> saveAll(List<Order> orders) {
        List<OrderEntity> entities = orders.stream()
                .map(this::toEntity)
                .collect(Collectors.toList());
        return jpaRepository.saveAll(entities).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    private OrderEntity toEntity(Order order) {
        return new OrderEntity(
            order.getId(),
            null,
            order.getPortfolioId(),
            order.getUserId(),
            order.getType(),
            order.getSymbol(),
            order.getTargetPrice(),
            order.getQuantity(),
            order.getUsdAmount(),
            order.getStatus(),
            order.getCreatedAt(),
            order.getFilledAt(),
            order.getExpiresAt(),
            order.getFilledPrice(),
            order.getFilledQuantity(),
            order.getRejectionReason()
        );
    }

    private Order toDomain(OrderEntity entity) {
        if (entity == null) {
            return null;
        }
        return new Order(
            entity.getId(),
            entity.getPortfolioId(),
            entity.getUserId(),
            entity.getType(),
            entity.getSymbol(),
            entity.getTargetPrice(),
            entity.getQuantity(),
            entity.getUsdAmount(),
            entity.getStatus(),
            entity.getCreatedAt(),
            entity.getFilledAt(),
            entity.getExpiresAt(),
            entity.getFilledPrice(),
            entity.getFilledQuantity(),
            entity.getRejectionReason()
        );
    }
}
