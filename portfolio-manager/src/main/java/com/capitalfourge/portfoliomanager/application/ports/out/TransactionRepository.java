package com.capitalfourge.portfoliomanager.application.ports.out;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.capitalfourge.portfoliomanager.domain.Transaction;

public interface TransactionRepository {

    Transaction save(Transaction transaction);

    Page<Transaction> findByPortfolioId(UUID portfolioId, Pageable pageable);

    // Legacy method (for backward compatibility)
    List<Transaction> findByPortfolioId(UUID portfolioId);
}
