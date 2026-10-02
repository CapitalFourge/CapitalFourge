package com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.capitalfourge.portfoliomanager.application.ports.out.OrderRepository;
import com.capitalfourge.portfoliomanager.domain.Order;
import com.capitalfourge.portfoliomanager.domain.OrderStatus;
import com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence.Entities.OrderEntity;
import com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence.Entities.PortfolioEntity;
import com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence.Repositories.JpaOrderRepository;
import com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence.Repositories.JpaPortfolioRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class OrderPersistenceAdapter implements OrderRepository {

    private static final Logger log = LoggerFactory.getLogger(OrderPersistenceAdapter.class);

    private final JpaOrderRepository jpaRepository;
    private final JpaPortfolioRepository jpaPortfolioRepository;

    @Override
    @Transactional
    public Order save(Order order) {
        log.info("Saving order: id={}, portfolioId={}, type={}, status={}", 
            order.getId(), order.getPortfolioId(), order.getType(), order.getStatus());
        OrderEntity entity = toEntity(order);
        log.debug("Converted to entity: portfolio={}, portfolioId={}", 
            entity.getPortfolio(), entity.getPortfolioId());
        OrderEntity savedEntity = jpaRepository.save(entity);
        log.info("Saved order entity: id={}", savedEntity.getId());
        return toDomain(savedEntity);
    }

    // Save and return the managed entity (for orphanRemoval fix)
    @Transactional
    public OrderEntity saveAndReturnEntity(Order order, PortfolioEntity portfolioEntity) {
        log.info("Saving order and returning entity: id={}, portfolioId={}, type={}, status={}", 
            order.getId(), order.getPortfolioId(), order.getType(), order.getStatus());
        OrderEntity entity = toEntityWithPortfolio(order, portfolioEntity);
        OrderEntity savedEntity = jpaRepository.save(entity);
        log.info("Saved order entity: id={}", savedEntity.getId());
        return savedEntity;
    }

    private OrderEntity toEntityWithPortfolio(Order order, PortfolioEntity portfolioEntity) {
        OrderEntity entity = new OrderEntity(
            order.getId(),
            portfolioEntity,
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
        entity.setPortfolioName(order.getPortfolioName());
        return entity;
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
        return jpaRepository.findByStatus(status, pageable).map(this::toDomain);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Order> findByPortfolioId(UUID portfolioId) {
        return jpaRepository.findByPortfolioId(portfolioId).stream()
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
        return jpaRepository.findByStatus(status, org.springframework.data.domain.Pageable.unpaged()).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<Order> findByUserIdAndStatus(UUID userId, OrderStatus status, Pageable pageable) {
        return jpaRepository.findByUserIdAndStatus(userId, status, pageable).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<Order> findPendingOrdersBySymbol(String symbol) {
        return jpaRepository.findByStatusAndSymbol(OrderStatus.PENDING, symbol).stream()
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

    public OrderEntity toEntity(Order order) {
        PortfolioEntity portfolioEntity = null;
        try {
            portfolioEntity = jpaPortfolioRepository.findById(order.getPortfolioId()).orElse(null);
        } catch (Exception e) {
            log.warn("Could not fetch portfolio for order {}: {}", order.getId(), e.getMessage());
        }
        OrderEntity entity = new OrderEntity(
            order.getId(),
            portfolioEntity,
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
        entity.setPortfolioName(order.getPortfolioName());
        return entity;
    }

    public Order toDomain(OrderEntity entity) {
        if (entity == null) {
            return null;
        }
        // Use portfolioName field (transient, set at creation) to avoid lazy loading issues
        // The portfolio relationship may be a proxy that fails to initialize outside transaction
        String portfolioName = entity.getPortfolioName();
        return new Order(
            entity.getId(),
            entity.getPortfolioId(),
            portfolioName,
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
