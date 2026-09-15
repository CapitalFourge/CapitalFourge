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
import com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence.Entities.PortfolioEntity;
import com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence.Mappers.PortfolioMapper;
import com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence.Repositories.JpaPortfolioRepository;
import com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence.Repositories.JpaTransactionRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class PortfolioPersistenceAdapter implements PortfolioRepository {

    private final JpaPortfolioRepository jpaRepository;
    private final JpaTransactionRepository transactionRepository;
    private final PortfolioMapper mapper;

    @Override
    public Portfolio save(Portfolio portfolio) {
        PortfolioEntity entity = mapper.toEntity(portfolio);
        entity = jpaRepository.save(entity);
        return mapper.toDomain(entity);
    }

    @Override
    public Optional<Portfolio> findById(UUID id) {
        return jpaRepository.findById(id).map(this::toDomain);
    }

    @Override
    public Page<Portfolio> findByUserId(UUID userId, Pageable pageable) {
        return jpaRepository.findByUserId(userId, pageable).map(this::toDomain);
    }

    @Override
    public Optional<Portfolio> findByShareSlug(String shareSlug) {
        return jpaRepository.findByShareSlug(shareSlug).map(this::toDomain);
    }

    @Override
    public Optional<Portfolio> findByName(String name) {
        return jpaRepository.findByName(name).map(this::toDomain);
    }

    @Override
    public Optional<Portfolio> findByUserIdAndName(UUID userId, String name) {
        return jpaRepository.findByUserIdAndName(userId, name).map(this::toDomain);
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
    public Integer countPublicByName(String name) {
        return jpaRepository.countPublicByName(name);
    }

    @Override
    @Transactional
    public void deleteById(UUID id) {
        jpaRepository.deleteById(id);
    }

    @Override
    public List<Portfolio> findByIds(List<UUID> ids) {
        return jpaRepository.findByIds(ids).stream().map(this::toDomain).collect(Collectors.toList());
    }

    // Legacy methods (for backward compatibility)
    @Override
    public List<Portfolio> findByUserId(UUID userId) {
        return jpaRepository.findByUserId(userId, org.springframework.data.domain.Pageable.unpaged())
                .stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    private Portfolio toDomain(PortfolioEntity entity) {
        return mapper.toDomain(entity);
    }
}
