package com.capitalfourge.portfoliomanager.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
public class ForexPricePoint {
    private String timestamp;
    private Float open;
    private Float high;
    private Float low;
    private Float close;
    private Float volume;
    
    private String date;
    private Float marketCap;
    
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
    
    // Explicit all-args constructor for Lombok compatibility
    public ForexPricePoint(String timestamp, Float open, Float high, Float low, Float close, Float volume,
                          String date, Float marketCap) {
        this.timestamp = timestamp;
        this.open = open;
        this.high = high;
        this.low = low;
        this.close = close;
        this.volume = volume;
        this.date = date;
        this.marketCap = marketCap;
    }
}