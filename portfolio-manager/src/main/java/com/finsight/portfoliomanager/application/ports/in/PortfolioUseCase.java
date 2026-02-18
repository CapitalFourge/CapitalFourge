package com.finsight.portfoliomanager.application.ports.in;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import com.finsight.portfoliomanager.domain.Portfolio;

public interface PortfolioUseCase {

    Portfolio createPortfolio(Portfolio portfolio);

    Portfolio getPortfolio(UUID id);

    List<Portfolio> getPortfoliosByUser(UUID userId);

    Portfolio buyAsset(UUID portfolioId, String symbol, BigDecimal quantity, BigDecimal price);

    Portfolio sellAsset(UUID portfolioId, String symbol, BigDecimal quantity, BigDecimal price);

    Portfolio addCash(UUID portfolioId, BigDecimal amount);

    Portfolio withdrawCash(UUID portfolioId, BigDecimal amount);

    Portfolio buyAssetByUSD(UUID portfolioId, String symbol, BigDecimal usdAmount, BigDecimal price);

    Portfolio sellAssetByUSD(UUID portfolioId, String symbol, BigDecimal usdAmount, BigDecimal price);

    void deletePortfolio(UUID id);
}
