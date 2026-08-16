package com.capitalfourge.portfoliomanager.application.ports.in;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import com.capitalfourge.portfoliomanager.domain.Order;
import com.capitalfourge.portfoliomanager.domain.OrderType;
import com.capitalfourge.portfoliomanager.domain.Portfolio;

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

    void repairUserBalance(UUID userId);

    Portfolio toggleVisibility(UUID portfolioId, boolean isPublic);

    List<Portfolio> getPublicLeaderboard();

    Portfolio getPortfolioBySlug(String slug);

    Order createLimitOrder(UUID portfolioId, UUID userId, OrderType type, String symbol, BigDecimal targetPrice, BigDecimal quantity, BigDecimal usdAmount);

    List<Order> getOrdersByPortfolio(UUID portfolioId);

    Order cancelOrder(UUID orderId, UUID userId);
}
