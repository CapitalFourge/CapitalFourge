package com.finsight.portfoliomanager.infrastructure.adapters.out.persistence.Repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;

import com.finsight.portfoliomanager.infrastructure.adapters.out.persistence.Entities.PortfolioEntity;

public interface JpaPortfolioRepository extends JpaRepository<PortfolioEntity, UUID> {

    @EntityGraph(attributePaths = {"positions"})
    List<PortfolioEntity> findByUserId(UUID userId);

}
