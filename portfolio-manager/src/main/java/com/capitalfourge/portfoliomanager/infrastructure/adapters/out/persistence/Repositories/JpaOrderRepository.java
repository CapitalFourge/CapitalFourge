package com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence.Repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence.Entities.OrderEntity;
import com.capitalfourge.portfoliomanager.domain.OrderStatus;

@Repository
public interface JpaOrderRepository extends JpaRepository<OrderEntity, UUID> {

    List<OrderEntity> findByPortfolioId(UUID portfolioId);

    List<OrderEntity> findByUserId(UUID userId);

    List<OrderEntity> findByStatus(String status);

    List<OrderEntity> findBySymbol(String symbol);

    List<OrderEntity> findByStatusAndSymbol(String status, String symbol);
}
