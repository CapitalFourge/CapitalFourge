package com.capitalfourge.portfoliomanager.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
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
    
    // Explicit getters/setters for Lombok compatibility
    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
    public Float getOpen() { return open; }
    public void setOpen(Float open) { this.open = open; }
    public Float getHigh() { return high; }
    public void setHigh(Float high) { this.high = high; }
    public Float getLow() { return low; }
    public void setLow(Float low) { this.low = low; }
    public Float getClose() { return close; }
    public void setClose(Float close) { this.close = close; }
    public Float getVolume() { return volume; }
    public void setVolume(Float volume) { this.volume = volume; }
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    public Float getMarketCap() { return marketCap; }
    public void setMarketCap(Float marketCap) { this.marketCap = marketCap; }
    public Float getInventoryLevels() { return inventoryLevels; }
    public void setInventoryLevels(Float inventoryLevels) { this.inventoryLevels = inventoryLevels; }
    public Float getCostOfProduction() { return costOfProduction; }
    public void setCostOfProduction(Float costOfProduction) { this.costOfProduction = costOfProduction; }
    public Float getAllInSustainingCost() { return allInSustainingCost; }
    public void setAllInSustainingCost(Float allInSustainingCost) { this.allInSustainingCost = allInSustainingCost; }
    public Float getReserveReplacementRatio() { return reserveReplacementRatio; }
    public void setReserveReplacementRatio(Float reserveReplacementRatio) { this.reserveReplacementRatio = reserveReplacementRatio; }
    public Float getContangoBackwardation() { return contangoBackwardation; }
    public void setContangoBackwardation(Float contangoBackwardation) { this.contangoBackwardation = contangoBackwardation; }
    public Float getDollarIndexExposure() { return dollarIndexExposure; }
    public void setDollarIndexExposure(Float dollarIndexExposure) { this.dollarIndexExposure = dollarIndexExposure; }
    public Float getInflationCorrelation() { return inflationCorrelation; }
    public void setInflationCorrelation(Float inflationCorrelation) { this.inflationCorrelation = inflationCorrelation; }
    public Float getOpecSpareCapacity() { return opecSpareCapacity; }
    public void setOpecSpareCapacity(Float opecSpareCapacity) { this.opecSpareCapacity = opecSpareCapacity; }
    public Float getChineseDemandIndex() { return chineseDemandIndex; }
    public void setChineseDemandIndex(Float chineseDemandIndex) { this.chineseDemandIndex = chineseDemandIndex; }
    public Float getWeatherIndex() { return weatherIndex; }
    public void setWeatherIndex(Float weatherIndex) { this.weatherIndex = weatherIndex; }
    
    // Explicit all-args constructor for Lombok compatibility
    public CommodityPricePoint(String timestamp, Float open, Float high, Float low, Float close, Float volume,
                              String date, Float marketCap, Float inventoryLevels, Float costOfProduction,
                              Float allInSustainingCost, Float reserveReplacementRatio, Float contangoBackwardation,
                              Float dollarIndexExposure, Float inflationCorrelation, Float opecSpareCapacity,
                              Float chineseDemandIndex, Float weatherIndex) {
        this.timestamp = timestamp;
        this.open = open;
        this.high = high;
        this.low = low;
        this.close = close;
        this.volume = volume;
        this.date = date;
        this.marketCap = marketCap;
        this.inventoryLevels = inventoryLevels;
        this.costOfProduction = costOfProduction;
        this.allInSustainingCost = allInSustainingCost;
        this.reserveReplacementRatio = reserveReplacementRatio;
        this.contangoBackwardation = contangoBackwardation;
        this.dollarIndexExposure = dollarIndexExposure;
        this.inflationCorrelation = inflationCorrelation;
        this.opecSpareCapacity = opecSpareCapacity;
        this.chineseDemandIndex = chineseDemandIndex;
        this.weatherIndex = weatherIndex;
    }
}