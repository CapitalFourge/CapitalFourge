package com.capitalfourge.portfoliomanager.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
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
    
    // Explicit no-args constructor for Lombok compatibility
    public PricePoint() {}
}