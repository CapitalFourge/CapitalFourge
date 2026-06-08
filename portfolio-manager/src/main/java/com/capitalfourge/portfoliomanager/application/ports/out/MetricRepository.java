package com.capitalfourge.portfoliomanager.application.ports.out;

import java.util.Map;

public interface MetricRepository {
    void incrementAssetVolume(String symbol, double volume);

    Double getAssetVolume(String symbol);

    Map<String, Double> getTrendingAssets(int topN);

    void recordUserActivity(String userId);

    Long getTotalUsers();

    void incrementPortfolioCount();

    Long getTotalPortfolios();

    void updatePortfolioPerformance(String portfolioId, double profit);

    Map<String, Double> getTopPortfolios(int topN);
}
