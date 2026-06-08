package com.capitalfourge.portfoliomanager.application.ports.out;

import java.util.List;
import java.util.UUID;

import com.capitalfourge.portfoliomanager.domain.Transaction;

public interface TransactionRepository {

    Transaction save(Transaction transaction);

    List<Transaction> findByPortfolioId(UUID portfolioId);
}
