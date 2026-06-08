package com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence.Repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence.Entities.TransactionEntity;

public interface JpaTransactionRepository extends JpaRepository<TransactionEntity, UUID> {

    List<TransactionEntity> findByPortfolioId(UUID portfolioId);

}
