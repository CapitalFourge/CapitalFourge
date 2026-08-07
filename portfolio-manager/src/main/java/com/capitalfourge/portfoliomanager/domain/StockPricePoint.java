package com.capitalfourge.portfoliomanager.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockPricePoint {
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
}