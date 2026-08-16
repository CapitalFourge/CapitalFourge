package com.capitalfourge.portfoliomanager.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
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
    public Float getCirculatingSupply() { return circulatingSupply; }
    public void setCirculatingSupply(Float circulatingSupply) { this.circulatingSupply = circulatingSupply; }
    public Float getTotalSupply() { return totalSupply; }
    public void setTotalSupply(Float totalSupply) { this.totalSupply = totalSupply; }
    public Float getMaxSupply() { return maxSupply; }
    public void setMaxSupply(Float maxSupply) { this.maxSupply = maxSupply; }
    public Float getInflationRate() { return inflationRate; }
    public void setInflationRate(Float inflationRate) { this.inflationRate = inflationRate; }
    public Float getFdv() { return fdv; }
    public void setFdv(Float fdv) { this.fdv = fdv; }
    public Float getActiveAddresses() { return activeAddresses; }
    public void setActiveAddresses(Float activeAddresses) { this.activeAddresses = activeAddresses; }
    public Float getTransactionVolume() { return transactionVolume; }
    public void setTransactionVolume(Float transactionVolume) { this.transactionVolume = transactionVolume; }
    public Float getTransactionCount() { return transactionCount; }
    public void setTransactionCount(Float transactionCount) { this.transactionCount = transactionCount; }
    public Float getFeesGenerated() { return feesGenerated; }
    public void setFeesGenerated(Float feesGenerated) { this.feesGenerated = feesGenerated; }
    public Float getTvl() { return tvl; }
    public void setTvl(Float tvl) { this.tvl = tvl; }
    public Float getHashRate() { return hashRate; }
    public void setHashRate(Float hashRate) { this.hashRate = hashRate; }
    public Float getStakingRatio() { return stakingRatio; }
    public void setStakingRatio(Float stakingRatio) { this.stakingRatio = stakingRatio; }
    public Float getNakamotoCoefficient() { return nakamotoCoefficient; }
    public void setNakamotoCoefficient(Float nakamotoCoefficient) { this.nakamotoCoefficient = nakamotoCoefficient; }
    public Float getOrderBookDepth() { return orderBookDepth; }
    public void setOrderBookDepth(Float orderBookDepth) { this.orderBookDepth = orderBookDepth; }
    public Float getDeveloperActivity() { return developerActivity; }
    public void setDeveloperActivity(Float developerActivity) { this.developerActivity = developerActivity; }
    public Float getUserGrowth() { return userGrowth; }
    public void setUserGrowth(Float userGrowth) { this.userGrowth = userGrowth; }
    public Float getRevenue() { return revenue; }
    public void setRevenue(Float revenue) { this.revenue = revenue; }
    public Float getPriceToFeesRatio() { return priceToFeesRatio; }
    public void setPriceToFeesRatio(Float priceToFeesRatio) { this.priceToFeesRatio = priceToFeesRatio; }
    public Float getBitcoinDominance() { return bitcoinDominance; }
    public void setBitcoinDominance(Float bitcoinDominance) { this.bitcoinDominance = bitcoinDominance; }
    public Float getFearGreedIndex() { return fearGreedIndex; }
    public void setFearGreedIndex(Float fearGreedIndex) { this.fearGreedIndex = fearGreedIndex; }
    
    // Explicit all-args constructor for Lombok compatibility
    public CryptoPricePoint(String timestamp, Float open, Float high, Float low, Float close, Float volume,
                           String date, Float marketCap, Float circulatingSupply, Float totalSupply,
                           Float maxSupply, Float inflationRate, Float fdv, Float activeAddresses,
                           Float transactionVolume, Float transactionCount, Float feesGenerated,
                           Float tvl, Float hashRate, Float stakingRatio, Float nakamotoCoefficient,
                           Float orderBookDepth, Float developerActivity, Float userGrowth,
                           Float revenue, Float priceToFeesRatio, Float bitcoinDominance,
                           Float fearGreedIndex) {
        this.timestamp = timestamp;
        this.open = open;
        this.high = high;
        this.low = low;
        this.close = close;
        this.volume = volume;
        this.date = date;
        this.marketCap = marketCap;
        this.circulatingSupply = circulatingSupply;
        this.totalSupply = totalSupply;
        this.maxSupply = maxSupply;
        this.inflationRate = inflationRate;
        this.fdv = fdv;
        this.activeAddresses = activeAddresses;
        this.transactionVolume = transactionVolume;
        this.transactionCount = transactionCount;
        this.feesGenerated = feesGenerated;
        this.tvl = tvl;
        this.hashRate = hashRate;
        this.stakingRatio = stakingRatio;
        this.nakamotoCoefficient = nakamotoCoefficient;
        this.orderBookDepth = orderBookDepth;
        this.developerActivity = developerActivity;
        this.userGrowth = userGrowth;
        this.revenue = revenue;
        this.priceToFeesRatio = priceToFeesRatio;
        this.bitcoinDominance = bitcoinDominance;
        this.fearGreedIndex = fearGreedIndex;
    }
}