package com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence.Repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence.Entities.OrderEntity;
import com.capitalfourge.portfoliomanager.domain.OrderStatus;

@Repository
public interface JpaOrderRepository extends JpaRepository<OrderEntity, UUID> {

    @EntityGraph(attributePaths = {"portfolio"}, type = EntityGraph.EntityGraphType.FETCH)
    Page<OrderEntity> findByPortfolioId(UUID portfolioId, Pageable pageable);

    @EntityGraph(attributePaths = {"portfolio"}, type = EntityGraph.EntityGraphType.FETCH)
    Page<OrderEntity> findByUserId(UUID userId, Pageable pageable);

    Page<OrderEntity> findByStatus(String status, Pageable pageable);

    List<OrderEntity> findBySymbol(String symbol);

    List<OrderEntity> findByStatusAndSymbol(String status, String symbol);
}