package com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence.Repositories;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence.Entities.PortfolioEntity;

public interface JpaPortfolioRepository extends JpaRepository<PortfolioEntity, UUID> {

    Optional<PortfolioEntity> findByShareSlug(String shareSlug);

    Optional<PortfolioEntity> findByName(String name);

    @Query("SELECT p FROM PortfolioEntity p WHERE p.userId = :userId AND p.name = :name")
    Optional<PortfolioEntity> findByUserIdAndName(@Param("userId") UUID userId, @Param("name") String name);

    @Query("SELECT p FROM PortfolioEntity p LEFT JOIN FETCH p.positions WHERE p.id = :id")
    Optional<PortfolioEntity> findByIdWithPositionsAndTransactions(@Param("id") UUID id);

    @EntityGraph(attributePaths = {"positions"}, type = EntityGraph.EntityGraphType.FETCH)
    Page<PortfolioEntity> findByUserId(UUID userId, Pageable pageable);

    @EntityGraph(attributePaths = {"positions"}, type = EntityGraph.EntityGraphType.FETCH)
    Page<PortfolioEntity> findByIsPublicTrueOrderByPerformanceDesc(Pageable pageable);

    @EntityGraph(attributePaths = {"positions"}, type = EntityGraph.EntityGraphType.FETCH)
    Optional<PortfolioEntity> findById(UUID id);

    @Query("SELECT p FROM PortfolioEntity p LEFT JOIN FETCH p.positions WHERE p.id IN :ids")
    List<PortfolioEntity> findByIds(@Param("ids") List<UUID> ids);
}