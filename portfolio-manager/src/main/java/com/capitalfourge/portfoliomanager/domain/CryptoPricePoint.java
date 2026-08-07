package com.capitalfourge.portfoliomanager.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CryptoPricePoint {
    private String timestamp;
    private Float open;
    private Float high;
    private Float low;
    private Float close;
    private Float volume;
    
    private String date;
    private Float marketCap;
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
}