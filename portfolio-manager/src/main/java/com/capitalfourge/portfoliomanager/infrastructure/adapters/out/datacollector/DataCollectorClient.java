package com.capitalfourge.portfoliomanager.infrastructure.adapters.out.datacollector;

import java.util.List;

public interface DataCollectorClient {
    
    List<AssetDTO> getAssetsByCategory(String category);
    
    List<AssetDTO> searchSymbols(String query, int limit);
    
    AssetDTO getAsset(String symbol);
    
    List<PricePointDTO> getPriceHistory(String symbol, String range);
    
    List<AssetMoverDTO> getAssetMovers(String category, String sort, int limit);

    record AssetDTO(
        String symbol, 
        String name, 
        String category,
        String description,
        String website,
        String logo,
        String sector,
        String industry
    ) {}
    
    record PricePointDTO(
        String timestamp, 
        Float open, 
        Float high, 
        Float low, 
        Float close, 
        Float volume,
        String date,
        Float marketCap,
        Float trailingPe,
        Float forwardPe,
        Float pegRatio,
        Float priceToBook,
        Float priceToSales,
        Float enterpriseToEbitda,
        Float profitMargins,
        Float operatingMargins,
        Float returnOnEquity,
        Float returnOnAssets,
        Float debtToEquity,
        Float currentRatio,
        Float quickRatio,
        Float dividendYield,
        Float freeCashFlow,
        Float circulatingSupply,
        Float totalSupply,
        Float maxSupply,
        Float inflationRate,
        Float fdv,
        Float activeAddresses,
        Float transactionVolume,
        Float transactionCount,
        Float feesGenerated,
        Float tvl,
        Float hashRate,
        Float stakingRatio,
        Float nakamotoCoefficient,
        Float orderBookDepth,
        Float developerActivity,
        Float userGrowth,
        Float revenue,
        Float priceToFeesRatio,
        Float bitcoinDominance,
        Float fearGreedIndex,
        Float inventoryLevels,
        Float costOfProduction,
        Float allInSustainingCost,
        Float reserveReplacementRatio,
        Float contangoBackwardation,
        Float dollarIndexExposure,
        Float inflationCorrelation,
        Float opecSpareCapacity,
        Float chineseDemandIndex,
        Float weatherIndex
    ) {}
    
    record AssetMoverDTO(String symbol, String name, Float price, Float changePercent, Float changeValue, Float volume) {}
}