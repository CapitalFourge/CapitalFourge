package com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence.Entities;

import jakarta.persistence.*;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import com.capitalfourge.portfoliomanager.domain.OrderStatus;
import com.capitalfourge.portfoliomanager.domain.OrderType;

import lombok.*;

@Entity
@Table(name = "orders")
@Data
public class OrderEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "portfolio_id", nullable = false, insertable = false, updatable = false)
    private PortfolioEntity portfolio;

    @Column(name = "portfolio_id", nullable = false)
    private UUID portfolioId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private OrderType type;

    @Column(name = "symbol", nullable = false)
    private String symbol;

    @Column(name = "target_price", nullable = false, precision = 20, scale = 8)
    private BigDecimal targetPrice;

    @Column(name = "quantity", precision = 20, scale = 8)
    private BigDecimal quantity;

    @Column(name = "usd_amount", precision = 20, scale = 8)
    private BigDecimal usdAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private OrderStatus status;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "filled_at")
    private LocalDateTime filledAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "filled_price", precision = 20, scale = 8)
    private BigDecimal filledPrice;

    @Column(name = "filled_quantity", precision = 20, scale = 8)
    private BigDecimal filledQuantity;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;
    
    // Explicit getters/setters for Lombok compatibility
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public PortfolioEntity getPortfolio() { return portfolio; }
    public void setPortfolio(PortfolioEntity portfolio) { this.portfolio = portfolio; }
    public UUID getPortfolioId() { return portfolioId; }
    public void setPortfolioId(UUID portfolioId) { this.portfolioId = portfolioId; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public OrderType getType() { return type; }
    public void setType(OrderType type) { this.type = type; }
    public String getSymbol() { return symbol; }
    public void setSymbol(String symbol) { this.symbol = symbol; }
    public BigDecimal getTargetPrice() { return targetPrice; }
    public void setTargetPrice(BigDecimal targetPrice) { this.targetPrice = targetPrice; }
    public BigDecimal getQuantity() { return quantity; }
    public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }
    public BigDecimal getUsdAmount() { return usdAmount; }
    public void setUsdAmount(BigDecimal usdAmount) { this.usdAmount = usdAmount; }
    public OrderStatus getStatus() { return status; }
    public void setStatus(OrderStatus status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getFilledAt() { return filledAt; }
    public void setFilledAt(LocalDateTime filledAt) { this.filledAt = filledAt; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
    public BigDecimal getFilledPrice() { return filledPrice; }
    public void setFilledPrice(BigDecimal filledPrice) { this.filledPrice = filledPrice; }
    public BigDecimal getFilledQuantity() { return filledQuantity; }
    public void setFilledQuantity(BigDecimal filledQuantity) { this.filledQuantity = filledQuantity; }
    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
    
    // Explicit all-args constructor for Lombok compatibility
    public OrderEntity(UUID id, PortfolioEntity portfolio, UUID portfolioId, UUID userId, OrderType type,
                       String symbol, BigDecimal targetPrice, BigDecimal quantity, BigDecimal usdAmount,
                       OrderStatus status, LocalDateTime createdAt, LocalDateTime filledAt,
                       LocalDateTime expiresAt, BigDecimal filledPrice, BigDecimal filledQuantity,
                       String rejectionReason) {
        this.id = id;
        this.portfolio = portfolio;
        this.portfolioId = portfolioId;
        this.userId = userId;
        this.type = type;
        this.symbol = symbol;
        this.targetPrice = targetPrice;
        this.quantity = quantity;
        this.usdAmount = usdAmount;
        this.status = status;
        this.createdAt = createdAt;
        this.filledAt = filledAt;
        this.expiresAt = expiresAt;
        this.filledPrice = filledPrice;
        this.filledQuantity = filledQuantity;
        this.rejectionReason = rejectionReason;
    }
}
