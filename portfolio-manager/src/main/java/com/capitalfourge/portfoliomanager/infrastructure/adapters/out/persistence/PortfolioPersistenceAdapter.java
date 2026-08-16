package com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.capitalfourge.portfoliomanager.application.ports.out.PortfolioRepository;
import com.capitalfourge.portfoliomanager.domain.Portfolio;
import com.capitalfourge.portfoliomanager.domain.Position;
import com.capitalfourge.portfoliomanager.domain.Transaction;
import com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence.Entities.PortfolioEntity;
import com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence.Entities.PositionEntity;
import com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence.Entities.TransactionEntity;
import com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence.Repositories.JpaPortfolioRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class PortfolioPersistenceAdapter implements PortfolioRepository {

    private final JpaPortfolioRepository jpaRepository;

    @Override
    @Transactional
    public Portfolio save(Portfolio portfolio) {
        PortfolioEntity entity = toEntity(portfolio);
        PortfolioEntity savedEntity = jpaRepository.save(entity);

        return toDomain(savedEntity);
    }

    @Override
    @Transactional
    public Optional<Portfolio> findById(UUID id) {
        return jpaRepository.findByIdWithPositionsAndTransactions(id).map(this::toDomain);
    }

    @Override
    public Page<Portfolio> findByUserId(UUID userId, Pageable pageable) {
        return jpaRepository.findByUserId(userId, pageable).map(this::toDomain);
    }

    @Override
    public List<Portfolio> findByUserId(UUID userId) {
        return jpaRepository.findByUserId(userId, org.springframework.data.domain.Pageable.unpaged())
                .stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public Optional<Portfolio> findByShareSlug(String shareSlug) {
        return jpaRepository.findByShareSlug(shareSlug).map(this::toDomain);
    }

    @Override
    public Page<Portfolio> findPublicPortfolios(Pageable pageable) {
        return jpaRepository.findByIsPublicTrueOrderByPerformanceDesc(pageable).map(this::toDomain);
    }

    @Override
    public List<Portfolio> findPublicPortfolios() {
        return jpaRepository.findByIsPublicTrueOrderByPerformanceDesc(org.springframework.data.domain.Pageable.unpaged())
                .stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    @Transactional
    public void deleteById(UUID id) {
        jpaRepository.deleteById(id);
    }

    @Override
    public List<Portfolio> findByIds(List<UUID> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        return jpaRepository.findByIdIn(ids).stream().map(this::toDomain).toList();
    }

    private PortfolioEntity toEntity(Portfolio domain) {
        PortfolioEntity entity = new PortfolioEntity(
            domain.getId(),
            domain.getName(),
            domain.getDescription(),
            domain.getUserId(),
            domain.getCumulativeDeposits(),
            domain.getCumulativeWithdrawals(),
            domain.getPerformance(),
            domain.getIsPublic(),
            domain.getShareSlug()
        );
        if (domain.getPositions() != null) {
            List<PositionEntity> positions = domain.getPositions()
                    .stream().map(p -> new PositionEntity(
                            p.getId(),
                            entity,
                            p.getSymbol(),
                            p.getQuantity(),
                            p.getAveragePurchasePrice(),
                            p.getCurrentPrice()
                    ))
                    .collect(Collectors.toList());
            entity.setPositions(positions);
        }
        if (domain.getTransactions() != null) {
            entity.setTransactions(domain.getTransactions().stream()
                    .map(t -> new TransactionEntity(
                            t.getId(),
                            entity,
                            t.getType(),
                            t.getSymbol(),
                            t.getQuantity(),
                            t.getPrice(),
                            t.getTimestamp(),
                            t.getBalanceTransaction()
                    ))
                    .collect(Collectors.toList()));
        }
        return entity;
    }

    private Portfolio toDomain(PortfolioEntity entity) {
        if (entity == null) {
            return null;
        }
        List<Position> domainPositions = entity.getPositions() == null ? null
                : entity.getPositions().stream().map(p -> new Position(
                        p.getId(),
                        entity.getId(),
                        p.getSymbol(),
                        p.getQuantity(),
                        p.getAveragePurchasePrice(),
                        p.getCurrentPrice(),
                        null
                )).collect(Collectors.toList());

        List<Transaction> domainTransactions = entity.getTransactions() == null ? new java.util.ArrayList<>()
                : entity.getTransactions().stream().map(t -> new Transaction(
                        t.getId(),
                        entity.getId(),
                        t.getType(),
                        t.getSymbol(),
                        t.getQuantity(),
                        t.getPrice(),
                        t.getPrice().multiply(t.getQuantity()),
                        t.getTimestamp(),
                        t.getBalanceTransaction()
                )).collect(Collectors.toList());

        return new Portfolio(
            entity.getId(),
            entity.getName(),
            entity.getDescription(),
            entity.getUserId(),
            domainPositions,
            domainTransactions,
            entity.getCumulativeDeposits(),
            entity.getCumulativeWithdrawals(),
            entity.getPerformance() != null ? entity.getPerformance() : 0.0,
            entity.isPublic(),
            entity.getShareSlug()
        );
    }

}