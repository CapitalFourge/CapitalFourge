package com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence.Repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;

import com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence.Entities.PortfolioEntity;

public interface JpaPortfolioRepository extends JpaRepository<PortfolioEntity, UUID> {

    @EntityGraph(attributePaths = {"positions"})
    List<PortfolioEntity> findByUserId(UUID userId);

    @EntityGraph(attributePaths = {"positions"})
    java.util.Optional<PortfolioEntity> findByShareSlug(String shareSlug);

    @EntityGraph(attributePaths = {"positions"})
    List<PortfolioEntity> findByIsPublicTrueOrderByPerformanceDesc();

    List<PortfolioEntity> findByIdIn(List<UUID> ids);
}