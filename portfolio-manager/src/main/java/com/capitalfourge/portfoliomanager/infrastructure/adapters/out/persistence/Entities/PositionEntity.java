package com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence.Entities;

import java.math.BigDecimal;
import java.util.UUID;

import jakarta.persistence.*;

@Entity
@Table(name = "positions")
public class PositionEntity {
    @Id
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "portfolio_id")
    private PortfolioEntity portfolio;

    private String symbol;
    @Column(precision = 20, scale = 8)
    private BigDecimal quantity;

    @Column(precision = 20, scale = 8)
    private BigDecimal averagePurchasePrice;

    @Column(precision = 20, scale = 8)
    private BigDecimal currentPrice;

    // Explicit getters/setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public PortfolioEntity getPortfolio() { return portfolio; }
    public void setPortfolio(PortfolioEntity portfolio) { this.portfolio = portfolio; }
    public String getSymbol() { return symbol; }
    public void setSymbol(String symbol) { this.symbol = symbol; }
    public BigDecimal getQuantity() { return quantity; }
    public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }
    public BigDecimal getAveragePurchasePrice() { return averagePurchasePrice; }
    public void setAveragePurchasePrice(BigDecimal averagePurchasePrice) { this.averagePurchasePrice = averagePurchasePrice; }
    public BigDecimal getCurrentPrice() { return currentPrice; }
    public void setCurrentPrice(BigDecimal currentPrice) { this.currentPrice = currentPrice; }

    // Explicit no-args constructor for JPA/Hibernate
    public PositionEntity() {}

    // Explicit all-args constructor
    public PositionEntity(UUID id, PortfolioEntity portfolio, String symbol,
                          BigDecimal quantity, BigDecimal averagePurchasePrice,
                          BigDecimal currentPrice) {
        this.id = id;
        this.portfolio = portfolio;
        this.symbol = symbol;
        this.quantity = quantity;
        this.averagePurchasePrice = averagePurchasePrice;
        this.currentPrice = currentPrice;
    }
}