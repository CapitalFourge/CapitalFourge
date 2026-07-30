package com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence.Repositories;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence.Entities.TransactionEntity;

public interface JpaTransactionRepository extends JpaRepository<TransactionEntity, UUID> {

    @EntityGraph(attributePaths = {"portfolio"}, type = EntityGraph.EntityGraphType.FETCH)
    Page<TransactionEntity> findByPortfolioId(UUID portfolioId, Pageable pageable);
}