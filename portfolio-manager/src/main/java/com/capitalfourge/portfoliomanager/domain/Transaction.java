package com.capitalfourge.portfoliomanager.domain;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
public class Transaction {

    private UUID id;
    private UUID portfolioId;
    private TransactionType type;
    private String symbol;
    private BigDecimal quantity;
    private BigDecimal price;
    private BigDecimal totalAmount;
    private LocalDateTime timestamp;
    private BigDecimal balanceTransaction;
    
    // Explicit getters/setters for Lombok compatibility
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getPortfolioId() { return portfolioId; }
    public void setPortfolioId(UUID portfolioId) { this.portfolioId = portfolioId; }
    public TransactionType getType() { return type; }
    public void setType(TransactionType type) { this.type = type; }
    public String getSymbol() { return symbol; }
    public void setSymbol(String symbol) { this.symbol = symbol; }
    public BigDecimal getQuantity() { return quantity; }
    public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    public BigDecimal getBalanceTransaction() { return balanceTransaction; }
    public void setBalanceTransaction(BigDecimal balanceTransaction) { this.balanceTransaction = balanceTransaction; }
    
    // Explicit all-args constructor for Lombok compatibility
    public Transaction(UUID id, UUID portfolioId, TransactionType type, String symbol,
                       BigDecimal quantity, BigDecimal price, BigDecimal totalAmount,
                       LocalDateTime timestamp, BigDecimal balanceTransaction) {
        this.id = id;
        this.portfolioId = portfolioId;
        this.type = type;
        this.symbol = symbol;
        this.quantity = quantity;
        this.price = price;
        this.totalAmount = totalAmount;
        this.timestamp = timestamp;
        this.balanceTransaction = balanceTransaction;
    }
}