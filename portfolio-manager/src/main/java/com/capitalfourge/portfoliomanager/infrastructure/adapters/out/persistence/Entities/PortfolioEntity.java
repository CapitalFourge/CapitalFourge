package com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence.Entities;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "portfolios")
@Getter
@Setter
@NamedEntityGraphs({
    @NamedEntityGraph(
        name = "Portfolio.withPositionsAndTransactions",
        attributeNodes = {
            @NamedAttributeNode("positions"),
            @NamedAttributeNode("transactions")
        }
    )
})
public class PortfolioEntity {
    @Id
    private UUID id;
    private String name;
    private String description;
    private UUID userId;
    private BigDecimal cumulativeDeposits;
    private BigDecimal cumulativeWithdrawals;
    // P2-11: Default performance to 0.0 to avoid null
        private Double performance = 0.0;
    private boolean isPublic;
    @Column(unique = true)
    private String shareSlug;

    @OneToMany(mappedBy = "portfolio", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
        private List<PositionEntity> positions = new ArrayList<>();

    @OneToMany(mappedBy = "portfolio", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
        private List<TransactionEntity> transactions = new ArrayList<>();

    @OneToMany(mappedBy = "portfolio", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
        private List<OrderEntity> orders = new ArrayList<>();
    
    // Explicit getters/setters for Lombok compatibility
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public BigDecimal getCumulativeDeposits() { return cumulativeDeposits; }
    public void setCumulativeDeposits(BigDecimal cumulativeDeposits) { this.cumulativeDeposits = cumulativeDeposits; }
    public BigDecimal getCumulativeWithdrawals() { return cumulativeWithdrawals; }
    public void setCumulativeWithdrawals(BigDecimal cumulativeWithdrawals) { this.cumulativeWithdrawals = cumulativeWithdrawals; }
    public Double getPerformance() { return performance; }
    public void setPerformance(Double performance) { this.performance = performance; }
    public boolean isPublic() { return isPublic; }
    public void setPublic(boolean isPublic) { this.isPublic = isPublic; }
    public String getShareSlug() { return shareSlug; }
    public void setShareSlug(String shareSlug) { this.shareSlug = shareSlug; }
    public List<PositionEntity> getPositions() { return positions; }
    public void setPositions(List<PositionEntity> positions) { this.positions = positions; }
    public List<TransactionEntity> getTransactions() { return transactions; }
    public void setTransactions(List<TransactionEntity> transactions) { this.transactions = transactions; }
    public List<OrderEntity> getOrders() { return orders; }
    public void setOrders(List<OrderEntity> orders) { this.orders = orders; }
    
    // Explicit no-args constructor for Lombok compatibility
    public PortfolioEntity() {
        this.positions = new ArrayList<>();
        this.transactions = new ArrayList<>();
        this.orders = new ArrayList<>();
    }
    
    // Explicit all-args constructor for Lombok compatibility
    public PortfolioEntity(UUID id, String name, String description, UUID userId,
                           BigDecimal cumulativeDeposits, BigDecimal cumulativeWithdrawals,
                           Double performance, boolean isPublic, String shareSlug) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.userId = userId;
        this.cumulativeDeposits = cumulativeDeposits;
        this.cumulativeWithdrawals = cumulativeWithdrawals;
        this.performance = performance;
        this.isPublic = isPublic;
        this.shareSlug = shareSlug;
        this.positions = new ArrayList<>();
        this.transactions = new ArrayList<>();
        this.orders = new ArrayList<>();
    }
}
