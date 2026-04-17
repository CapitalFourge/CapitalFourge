package com.finsight.portfoliomanager.application.ports.out;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.finsight.portfoliomanager.domain.Portfolio;

public interface PortfolioRepository {
    Portfolio save(Portfolio portfolio);

    Optional<Portfolio> findById(UUID id);

    List<Portfolio> findByUserId(UUID userId);

    Optional<Portfolio> findByShareSlug(String shareSlug);

    List<Portfolio> findPublicPortfolios();

    void deleteById(UUID id);
}
