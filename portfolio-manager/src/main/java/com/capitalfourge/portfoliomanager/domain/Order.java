package com.capitalfourge.portfoliomanager.domain;

import jakarta.persistence.Column;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class Order {

    private UUID id;
    private UUID portfolioId;
    private UUID userId;
    private OrderType type;
    private String symbol;
    private BigDecimal targetPrice;
    private BigDecimal quantity;
    private BigDecimal usdAmount;
    private OrderStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime filledAt;
    
    @Column(nullable = true)
    private LocalDateTime expiresAt;
    
    private BigDecimal filledPrice;
    private BigDecimal filledQuantity;
    private String rejectionReason;
    
    // Explicit getters/setters for Lombok compatibility
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
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
    public Order(UUID id, UUID portfolioId, UUID userId, OrderType type, String symbol,
                 BigDecimal targetPrice, BigDecimal quantity, BigDecimal usdAmount, OrderStatus status,
                 LocalDateTime createdAt, LocalDateTime filledAt, LocalDateTime expiresAt,
                 BigDecimal filledPrice, BigDecimal filledQuantity, String rejectionReason) {
        this.id = id;
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
