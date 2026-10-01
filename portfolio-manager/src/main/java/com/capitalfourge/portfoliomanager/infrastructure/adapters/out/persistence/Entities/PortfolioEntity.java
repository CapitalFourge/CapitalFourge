package com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence.Entities;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
    name = "portfolios",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "ux_portfolios_user_name",
            columnNames = {"user_id", "name"}
        ),
        @UniqueConstraint(
            name = "ux_portfolios_user_share_slug",
            columnNames = {"user_id", "share_slug"}
        )
    }
)
@Getter
@Setter
@NamedEntityGraphs({
    @NamedEntityGraph(
        name = "Portfolio.withPositions",
        attributeNodes = {
            @NamedAttributeNode("positions")
        }
    ),
    @NamedEntityGraph(
        name = "Portfolio.withTransactions",
        attributeNodes = {
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
    private BigDecimal allocatedCash = BigDecimal.ZERO;      // Cash available in this portfolio for trading
    private BigDecimal lockedCash = BigDecimal.ZERO;        // Cash locked in pending limit orders
    private BigDecimal totalAssigned = BigDecimal.ZERO;      // Total historically assigned to this portfolio (only increases)
    private BigDecimal totalWithdrawn = BigDecimal.ZERO;     // Total historically withdrawn from this portfolio (only increases)
    // P2-11: Default performance to 0.0 to avoid null
        private Double performance = 0.0;
    private boolean isPublic;
    @Column(unique = false)
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
    public BigDecimal getAllocatedCash() { return allocatedCash; }
    public void setAllocatedCash(BigDecimal allocatedCash) { this.allocatedCash = allocatedCash; }
    public BigDecimal getLockedCash() { return lockedCash; }
    public void setLockedCash(BigDecimal lockedCash) { this.lockedCash = lockedCash; }
    public BigDecimal getTotalAssigned() { return totalAssigned; }
    public void setTotalAssigned(BigDecimal totalAssigned) { this.totalAssigned = totalAssigned; }
    public BigDecimal getTotalWithdrawn() { return totalWithdrawn; }
    public void setTotalWithdrawn(BigDecimal totalWithdrawn) { this.totalWithdrawn = totalWithdrawn; }
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

        // Calculate total portfolio value (positions value + allocatedCash + lockedCash)
        public BigDecimal getTotalValue() {
            BigDecimal positionsValue = BigDecimal.ZERO;
            if (positions != null) {
                for (PositionEntity pos : positions) {
                    if (pos.getTotalValue() != null) {
                        positionsValue = positionsValue.add(pos.getTotalValue());
                    }
                }
            }
            BigDecimal allocated = allocatedCash != null ? allocatedCash : BigDecimal.ZERO;
            BigDecimal locked = lockedCash != null ? lockedCash : BigDecimal.ZERO;
            return positionsValue.add(allocated).add(locked);
        }

        // Explicit no-args constructor for Lombok compatibility
    public PortfolioEntity() {
        this.positions = new ArrayList<>();
        this.transactions = new ArrayList<>();
        this.orders = new ArrayList<>();
    }
    
    // Explicit all-args constructor for Lombok compatibility
    public PortfolioEntity(UUID id, String name, String description, UUID userId,
                           BigDecimal allocatedCash, BigDecimal totalAssigned, BigDecimal totalWithdrawn,
                           Double performance, boolean isPublic, String shareSlug) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.userId = userId;
        this.allocatedCash = allocatedCash;
        this.totalAssigned = totalAssigned;
        this.totalWithdrawn = totalWithdrawn;
        this.performance = performance;
        this.isPublic = isPublic;
        this.shareSlug = shareSlug;
        this.positions = new ArrayList<>();
        this.transactions = new ArrayList<>();
        this.orders = new ArrayList<>();
    }
}
