package com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence.Repositories;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence.Entities.OrderEntity;
import com.capitalfourge.portfoliomanager.domain.OrderStatus;

@Repository
public interface JpaOrderRepository extends JpaRepository<OrderEntity, UUID> {

    @EntityGraph(attributePaths = {"portfolio"}, type = EntityGraph.EntityGraphType.FETCH)
    Page<OrderEntity> findByPortfolioId(UUID portfolioId, Pageable pageable);

    @EntityGraph(attributePaths = {"portfolio"}, type = EntityGraph.EntityGraphType.FETCH)
    Page<OrderEntity> findByUserId(UUID userId, Pageable pageable);

    // Direct query without JOIN to avoid portfolio relationship issues
    @Query("SELECT o FROM OrderEntity o WHERE o.status = :status")
    Page<OrderEntity> findByStatus(OrderStatus status, Pageable pageable);

    List<OrderEntity> findByUserIdAndStatus(UUID userId, OrderStatus status, Pageable pageable);

    List<OrderEntity> findBySymbol(String symbol);

    List<OrderEntity> findByStatusAndSymbol(OrderStatus status, String symbol);

    @EntityGraph(attributePaths = {"portfolio"}, type = EntityGraph.EntityGraphType.FETCH)
    List<OrderEntity> findByPortfolioId(UUID portfolioId);

    @Query("SELECT o.portfolioId FROM OrderEntity o WHERE o.id = :orderId")
    Optional<UUID> findPortfolioIdByOrderId(@Param("orderId") UUID orderId);
}