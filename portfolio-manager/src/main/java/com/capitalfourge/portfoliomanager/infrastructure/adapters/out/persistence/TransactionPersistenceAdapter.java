package com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.capitalfourge.portfoliomanager.application.ports.out.TransactionRepository;
import com.capitalfourge.portfoliomanager.domain.Transaction;
import com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence.Entities.PortfolioEntity;
import com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence.Entities.TransactionEntity;
import com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence.Repositories.JpaTransactionRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class TransactionPersistenceAdapter implements TransactionRepository {

    private final JpaTransactionRepository jpaRepository;

    @Override
    @Transactional
    public Transaction save(Transaction transaction) {
        TransactionEntity entity = toEntity(transaction);
        TransactionEntity saved = jpaRepository.save(entity);
        return toDomain(saved);
    }

    @Override
    public Page<Transaction> findByPortfolioId(UUID portfolioId, Pageable pageable) {
        return jpaRepository.findByPortfolioId(portfolioId, pageable).map(this::toDomain);
    }

    @Override
    public List<Transaction> findByPortfolioId(UUID portfolioId) {
        return jpaRepository.findByPortfolioId(portfolioId, org.springframework.data.domain.Pageable.unpaged())
                .stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    private TransactionEntity toEntity(Transaction transaction) {
        return new TransactionEntity(
                transaction.getId(),
                new PortfolioEntity(transaction.getPortfolioId(), null, null, null, null, null, null, false, null),
                transaction.getType(),
                transaction.getSymbol(),
                transaction.getQuantity(),
                transaction.getPrice(),
                transaction.getTimestamp(),
                transaction.getBalanceTransaction()
        );
    }

    private Transaction toDomain(TransactionEntity entity) {
        if (entity == null) {
            return null;
        }
        return new Transaction(
                entity.getId(),
                entity.getPortfolio().getId(),
                entity.getType(),
                entity.getSymbol(),
                entity.getQuantity(),
                entity.getPrice(),
                entity.getPrice().multiply(entity.getQuantity()),
                entity.getTimestamp(),
                entity.getBalanceTransaction()
        );
    }

}
