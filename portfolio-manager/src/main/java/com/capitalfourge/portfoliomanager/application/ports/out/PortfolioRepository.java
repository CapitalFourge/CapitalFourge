package com.capitalfourge.portfoliomanager.application.ports.out;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.capitalfourge.portfoliomanager.domain.Portfolio;

public interface PortfolioRepository {
    Portfolio save(Portfolio portfolio);

    Optional<Portfolio> findById(UUID id);

    Page<Portfolio> findByUserId(UUID userId, Pageable pageable);

    Optional<Portfolio> findByShareSlug(String shareSlug);

    Optional<Portfolio> findByUserIdAndName(UUID userId, String name);

    Page<Portfolio> findPublicPortfolios(Pageable pageable);

    void deleteById(UUID id);

    List<Portfolio> findByIds(List<UUID> ids);

    Integer countPublicByName(String name);

    // Legacy methods (for backward compatibility)
    List<Portfolio> findByUserId(UUID userId);

    List<Portfolio> findPublicPortfolios();
    
    // For direct entity operations (e.g., cascade delete)
    Optional<com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence.Entities.PortfolioEntity> findEntityById(UUID id);
}
