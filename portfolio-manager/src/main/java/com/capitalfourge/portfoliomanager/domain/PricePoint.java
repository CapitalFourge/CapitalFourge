package com.capitalfourge.portfoliomanager.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PricePoint {
    private String timestamp;
    private Float open;
    private Float high;
    private Float low;
    private Float close;
    private Float volume;
    
    // Fundamental data fields (from data collector)
    private String date;
    private Float marketCap;
    private Float trailingPe;
    private Float forwardPe;
    private Float pegRatio;
    private Float priceToBook;
    private Float priceToSales;
    private Float enterpriseToEbitda;
    private Float profitMargins;
    private Float operatingMargins;
    private Float returnOnEquity;
    private Float returnOnAssets;
    private Float debtToEquity;
    private Float currentRatio;
    private Float quickRatio;
    private Float dividendYield;
    private Float freeCashFlow;
    private Float circulatingSupply;
    private Float totalSupply;
    private Float maxSupply;
    private Float inflationRate;
    private Float fdv;
    private Float activeAddresses;
    private Float transactionVolume;
    private Float transactionCount;
    private Float feesGenerated;
    private Float tvl;
    private Float hashRate;
    private Float stakingRatio;
    private Float nakamotoCoefficient;
    private Float orderBookDepth;
    private Float developerActivity;
    private Float userGrowth;
    private Float revenue;
    private Float priceToFeesRatio;
    private Float bitcoinDominance;
    private Float fearGreedIndex;
    private Float inventoryLevels;
    private Float costOfProduction;
    private Float allInSustainingCost;
    private Float reserveReplacementRatio;
    private Float contangoBackwardation;
    private Float dollarIndexExposure;
    private Float inflationCorrelation;
    private Float opecSpareCapacity;
    private Float chineseDemandIndex;
    private Float weatherIndex;
}