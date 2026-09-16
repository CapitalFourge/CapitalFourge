package com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence.Repositories;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence.Entities.TransactionEntity;

public interface JpaTransactionRepository extends JpaRepository<TransactionEntity, UUID> {

    @EntityGraph(attributePaths = {"portfolio"}, type = EntityGraph.EntityGraphType.FETCH)
    Page<TransactionEntity> findByPortfolioId(UUID portfolioId, Pageable pageable);

    @EntityGraph(attributePaths = {"portfolio"}, type = EntityGraph.EntityGraphType.FETCH)
    @Query("SELECT t FROM TransactionEntity t JOIN t.portfolio p WHERE p.userId = :userId AND t.timestamp BETWEEN :startDate AND :endDate ORDER BY t.timestamp DESC")
    Page<TransactionEntity> findByUserIdAndTimestampBetween(@Param("userId") UUID userId, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate, Pageable pageable);
}