package com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collector;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

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
    public Portfolio save(Portfolio portfolio) {
        PortfolioEntity entity = toEntity(portfolio);
        PortfolioEntity savedEntity = jpaRepository.save(entity);

        return toDomain(savedEntity);
    }

    @Override
    public Optional<Portfolio> findById(UUID id) {
        return jpaRepository.findById(id).map(this::toDomain);
    }

    @Override
    public List<Portfolio> findByUserId(UUID userId) {
        return jpaRepository.findByUserId(userId).stream().map(this::toDomain).toList();
    }

    @Override
    public Optional<Portfolio> findByShareSlug(String shareSlug) {
        return jpaRepository.findByShareSlug(shareSlug).map(this::toDomain);
    }

    @Override
    public List<Portfolio> findPublicPortfolios() {
        return jpaRepository.findByIsPublicTrueOrderByPerformanceDesc().stream().map(this::toDomain).toList();
    }

    @Override
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
        PortfolioEntity entity = PortfolioEntity.builder()
                .id(domain.getId())
                .name(domain.getName())
                .description(domain.getDescription())
                .userId(domain.getUserId())
                .cumulativeDeposits(domain.getCumulativeDeposits())
                .cumulativeWithdrawals(domain.getCumulativeWithdrawals())
                .performance(domain.getPerformance())
                .isPublic(domain.isPublic())
                .shareSlug(domain.getShareSlug())
                .build();
        if (domain.getPositions() != null) {
            List<PositionEntity> positions = domain.getPositions()
                    .stream().map(p -> PositionEntity.builder()
                            .id(p.getId())
                            .portfolio(entity)
                            .symbol(p.getSymbol())
                            .quantity(p.getQuantity())
                            .averagePurchasePrice(p.getAveragePurchasePrice())
                            .currentPrice(p.getCurrentPrice())
                            .build())
                    .collect(Collectors.toList());
            entity.setPositions(positions);
        }
        if (domain.getTransactions() != null) {
            entity.setTransactions(domain.getTransactions().stream()
                    .map(t -> TransactionEntity.builder()
                            .id(t.getId()).portfolio(entity).type(t.getType())
                            .symbol(t.getSymbol()).quantity(t.getQuantity())
                            .price(t.getPrice()).timestamp(t.getTimestamp())
                            .balanceTransaction(t.getBalanceTransaction()).build())
                    .collect(Collectors.toList()));
        }
        return entity;
    }

    private Portfolio toDomain(PortfolioEntity entity) {
        List<Position> domainPositions = entity.getPositions() == null ? null
                : entity.getPositions().stream().map(p -> Position.builder()
                        .id(p.getId())
                        .portfolioId(entity.getId())
                        .symbol(p.getSymbol())
                        .quantity(p.getQuantity())
                        .averagePurchasePrice(p.getAveragePurchasePrice())
                        .currentPrice(p.getCurrentPrice())
                        .build()).collect(Collectors.toList());

        List<Transaction> domainTransactions = entity.getTransactions() == null ? new java.util.ArrayList<>()
                : entity.getTransactions().stream().map(t -> Transaction.builder()
                        .id(t.getId())
                        .portfolioId(entity.getId())
                        .type(t.getType())
                        .symbol(t.getSymbol())
                        .quantity(t.getQuantity())
                        .price(t.getPrice())
                        .timestamp(t.getTimestamp())
                        .balanceTransaction(t.getBalanceTransaction())
                        .build()).collect(Collectors.toList());

        return Portfolio.builder()
                .id(entity.getId())
                .name(entity.getName())
                .description(entity.getDescription())
                .userId(entity.getUserId())
                .positions(domainPositions)
                .transactions(domainTransactions)
                .cumulativeDeposits(entity.getCumulativeDeposits())
                .cumulativeWithdrawals(entity.getCumulativeWithdrawals())
                .performance(entity.getPerformance() != null ? entity.getPerformance() : 0.0)
                .isPublic(entity.isPublic())
                .shareSlug(entity.getShareSlug())
                .build();
    }

}
