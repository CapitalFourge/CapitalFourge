package com.capitalfourge.portfoliomanager.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommodityPricePoint {
    private String timestamp;
    private Float open;
    private Float high;
    private Float low;
    private Float close;
    private Float volume;
    
    private String date;
    private Float marketCap;
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