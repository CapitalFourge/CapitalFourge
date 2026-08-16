package com.capitalfourge.portfoliomanager.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
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
    public Float getTrailingPe() { return trailingPe; }
    public void setTrailingPe(Float trailingPe) { this.trailingPe = trailingPe; }
    public Float getForwardPe() { return forwardPe; }
    public void setForwardPe(Float forwardPe) { this.forwardPe = forwardPe; }
    public Float getPegRatio() { return pegRatio; }
    public void setPegRatio(Float pegRatio) { this.pegRatio = pegRatio; }
    public Float getPriceToBook() { return priceToBook; }
    public void setPriceToBook(Float priceToBook) { this.priceToBook = priceToBook; }
    public Float getPriceToSales() { return priceToSales; }
    public void setPriceToSales(Float priceToSales) { this.priceToSales = priceToSales; }
    public Float getEnterpriseToEbitda() { return enterpriseToEbitda; }
    public void setEnterpriseToEbitda(Float enterpriseToEbitda) { this.enterpriseToEbitda = enterpriseToEbitda; }
    public Float getProfitMargins() { return profitMargins; }
    public void setProfitMargins(Float profitMargins) { this.profitMargins = profitMargins; }
    public Float getOperatingMargins() { return operatingMargins; }
    public void setOperatingMargins(Float operatingMargins) { this.operatingMargins = operatingMargins; }
    public Float getReturnOnEquity() { return returnOnEquity; }
    public void setReturnOnEquity(Float returnOnEquity) { this.returnOnEquity = returnOnEquity; }
    public Float getReturnOnAssets() { return returnOnAssets; }
    public void setReturnOnAssets(Float returnOnAssets) { this.returnOnAssets = returnOnAssets; }
    public Float getDebtToEquity() { return debtToEquity; }
    public void setDebtToEquity(Float debtToEquity) { this.debtToEquity = debtToEquity; }
    public Float getCurrentRatio() { return currentRatio; }
    public void setCurrentRatio(Float currentRatio) { this.currentRatio = currentRatio; }
    public Float getQuickRatio() { return quickRatio; }
    public void setQuickRatio(Float quickRatio) { this.quickRatio = quickRatio; }
    public Float getDividendYield() { return dividendYield; }
    public void setDividendYield(Float dividendYield) { this.dividendYield = dividendYield; }
    public Float getFreeCashFlow() { return freeCashFlow; }
    public void setFreeCashFlow(Float freeCashFlow) { this.freeCashFlow = freeCashFlow; }
    
    // Explicit all-args constructor for Lombok compatibility
    public StockPricePoint(String timestamp, Float open, Float high, Float low, Float close, Float volume,
                          String date, Float marketCap, Float trailingPe, Float forwardPe,
                          Float pegRatio, Float priceToBook, Float priceToSales,
                          Float enterpriseToEbitda, Float profitMargins, Float operatingMargins,
                          Float returnOnEquity, Float returnOnAssets, Float debtToEquity,
                          Float currentRatio, Float quickRatio, Float dividendYield, Float freeCashFlow) {
        this.timestamp = timestamp;
        this.open = open;
        this.high = high;
        this.low = low;
        this.close = close;
        this.volume = volume;
        this.date = date;
        this.marketCap = marketCap;
        this.trailingPe = trailingPe;
        this.forwardPe = forwardPe;
        this.pegRatio = pegRatio;
        this.priceToBook = priceToBook;
        this.priceToSales = priceToSales;
        this.enterpriseToEbitda = enterpriseToEbitda;
        this.profitMargins = profitMargins;
        this.operatingMargins = operatingMargins;
        this.returnOnEquity = returnOnEquity;
        this.returnOnAssets = returnOnAssets;
        this.debtToEquity = debtToEquity;
        this.currentRatio = currentRatio;
        this.quickRatio = quickRatio;
        this.dividendYield = dividendYield;
        this.freeCashFlow = freeCashFlow;
    }
}