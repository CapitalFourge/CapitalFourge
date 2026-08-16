package com.capitalfourge.portfoliomanager.domain;

import java.math.BigDecimal;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
public class Position {

    private UUID id;
    private UUID portfolioId;
    private String symbol;
    private BigDecimal quantity;
    private BigDecimal averagePurchasePrice;
    private BigDecimal currentPrice;
    private BigDecimal lockedQuantity;

    public BigDecimal getTotalValue() {
        return currentPrice.multiply(quantity);
    }

    public BigDecimal getProfitLoss() {
        return currentPrice.subtract(averagePurchasePrice).multiply(quantity);
    }

    public BigDecimal getAvailableQuantity() {
        return quantity.subtract(lockedQuantity != null ? lockedQuantity : BigDecimal.ZERO);
    }
    
    // Explicit getters/setters for Lombok compatibility
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getPortfolioId() { return portfolioId; }
    public void setPortfolioId(UUID portfolioId) { this.portfolioId = portfolioId; }
    public String getSymbol() { return symbol; }
    public void setSymbol(String symbol) { this.symbol = symbol; }
    public BigDecimal getQuantity() { return quantity; }
    public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }
    public BigDecimal getAveragePurchasePrice() { return averagePurchasePrice; }
    public void setAveragePurchasePrice(BigDecimal averagePurchasePrice) { this.averagePurchasePrice = averagePurchasePrice; }
    public BigDecimal getCurrentPrice() { return currentPrice; }
    public void setCurrentPrice(BigDecimal currentPrice) { this.currentPrice = currentPrice; }
    public BigDecimal getLockedQuantity() { return lockedQuantity; }
    public void setLockedQuantity(BigDecimal lockedQuantity) { this.lockedQuantity = lockedQuantity; }
    
    // Explicit all-args constructor for Lombok compatibility
    public Position(UUID id, UUID portfolioId, String symbol, BigDecimal quantity,
                    BigDecimal averagePurchasePrice, BigDecimal currentPrice, BigDecimal lockedQuantity) {
        this.id = id;
        this.portfolioId = portfolioId;
        this.symbol = symbol;
        this.quantity = quantity;
        this.averagePurchasePrice = averagePurchasePrice;
        this.currentPrice = currentPrice;
        this.lockedQuantity = lockedQuantity;
    }
}
