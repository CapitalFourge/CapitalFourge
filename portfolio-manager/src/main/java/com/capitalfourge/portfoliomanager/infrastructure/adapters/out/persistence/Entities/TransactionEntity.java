package com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence.Entities;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import com.capitalfourge.portfoliomanager.domain.TransactionType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "transactions")
@Getter
@Setter
public class TransactionEntity {

    @Id
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "portfolio_id")
    private PortfolioEntity portfolio;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionType type;

    @Column(nullable = false)
    private String symbol;

    @Column(nullable = false, precision = 20, scale = 8)
    private BigDecimal quantity;

    @Column(nullable = false, precision = 20, scale = 8)
    private BigDecimal price;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(nullable = false, precision = 20, scale = 8)
    private BigDecimal balanceTransaction;

    @PrePersist
    protected void onCreate() {
        if (timestamp == null) {
            timestamp = LocalDateTime.now();
        }
        if (balanceTransaction == null) {
            balanceTransaction = price.multiply(quantity);
        }
    }
    
    // Explicit getters/setters for Lombok compatibility
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public PortfolioEntity getPortfolio() { return portfolio; }
    public void setPortfolio(PortfolioEntity portfolio) { this.portfolio = portfolio; }
    public TransactionType getType() { return type; }
    public void setType(TransactionType type) { this.type = type; }
    public String getSymbol() { return symbol; }
    public void setSymbol(String symbol) { this.symbol = symbol; }
    public BigDecimal getQuantity() { return quantity; }
    public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    public BigDecimal getBalanceTransaction() { return balanceTransaction; }
    public void setBalanceTransaction(BigDecimal balanceTransaction) { this.balanceTransaction = balanceTransaction; }
    
    // Explicit no-args constructor for JPA/Hibernate
    public TransactionEntity() {}

    // Explicit all-args constructor for Lombok compatibility
    public TransactionEntity(UUID id, PortfolioEntity portfolio, TransactionType type,
                             String symbol, BigDecimal quantity, BigDecimal price,
                             LocalDateTime timestamp, BigDecimal balanceTransaction) {
        this.id = id;
        this.portfolio = portfolio;
        this.type = type;
        this.symbol = symbol;
        this.quantity = quantity;
        this.price = price;
        this.timestamp = timestamp;
        this.balanceTransaction = balanceTransaction;
    }
}
