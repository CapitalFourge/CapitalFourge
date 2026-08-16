package com.capitalfourge.portfoliomanager.domain;

import java.math.BigDecimal;

public class Asset {
    private String symbol;
    private String name;
    private String category;
    private String description;
    private String website;
    private String logo;
    private String sector;
    private String industry;
    private Float marketCap;
    private Float peRatio;
    private Float dividendYield;
    private Float beta;
    private Float week52High;
    private Float week52Low;
    // GraphQL schema fields
    private Float price;
    private Float change24h;
    private Float changePercent24h;
    private Float volume24h;

    // Explicit getters/setters
    public String getSymbol() { return symbol; }
    public void setSymbol(String symbol) { this.symbol = symbol; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getWebsite() { return website; }
    public void setWebsite(String website) { this.website = website; }
    public String getLogo() { return logo; }
    public void setLogo(String logo) { this.logo = logo; }
    public String getSector() { return sector; }
    public void setSector(String sector) { this.sector = sector; }
    public String getIndustry() { return industry; }
    public void setIndustry(String industry) { this.industry = industry; }
    public Float getMarketCap() { return marketCap; }
    public void setMarketCap(Float marketCap) { this.marketCap = marketCap; }
    public Float getPeRatio() { return peRatio; }
    public void setPeRatio(Float peRatio) { this.peRatio = peRatio; }
    public Float getDividendYield() { return dividendYield; }
    public void setDividendYield(Float dividendYield) { this.dividendYield = dividendYield; }
    public Float getBeta() { return beta; }
    public void setBeta(Float beta) { this.beta = beta; }
    public Float getWeek52High() { return week52High; }
    public void setWeek52High(Float week52High) { this.week52High = week52High; }
    public Float getWeek52Low() { return week52Low; }
    public void setWeek52Low(Float week52Low) { this.week52Low = week52Low; }
    public Float getPrice() { return price; }
    public void setPrice(Float price) { this.price = price; }
    public Float getChange24h() { return change24h; }
    public void setChange24h(Float change24h) { this.change24h = change24h; }
    public Float getChangePercent24h() { return changePercent24h; }
    public void setChangePercent24h(Float changePercent24h) { this.changePercent24h = changePercent24h; }
    public Float getVolume24h() { return volume24h; }
    public void setVolume24h(Float volume24h) { this.volume24h = volume24h; }

    // Explicit no-args constructor
    public Asset() {}

    // Explicit all-args constructor (without GraphQL schema fields)
    public Asset(String symbol, String name, String category, String description,
                 String website, String logo, String sector, String industry,
                 Float marketCap, Float peRatio, Float dividendYield, Float beta,
                 Float week52High, Float week52Low) {
        this.symbol = symbol;
        this.name = name;
        this.category = category;
        this.description = description;
        this.website = website;
        this.logo = logo;
        this.sector = sector;
        this.industry = industry;
        this.marketCap = marketCap;
        this.peRatio = peRatio;
        this.dividendYield = dividendYield;
        this.beta = beta;
        this.week52High = week52High;
        this.week52Low = week52Low;
        this.price = null;
        this.change24h = null;
        this.changePercent24h = null;
        this.volume24h = null;
    }

    // Full constructor with GraphQL schema fields
    public Asset(String symbol, String name, String category, String description,
                 String website, String logo, String sector, String industry,
                 Float marketCap, Float peRatio, Float dividendYield, Float beta,
                 Float week52High, Float week52Low,
                 Float price, Float change24h, Float changePercent24h, Float volume24h) {
        this(symbol, name, category, description, website, logo, sector, industry,
             marketCap, peRatio, dividendYield, beta, week52High, week52Low);
        this.price = price;
        this.change24h = change24h;
        this.changePercent24h = changePercent24h;
        this.volume24h = volume24h;
    }
}