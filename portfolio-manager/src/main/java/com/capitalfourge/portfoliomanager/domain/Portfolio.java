package com.capitalfourge.portfoliomanager.domain;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import com.capitalfourge.portfoliomanager.domain.Order;

@Data
public class Portfolio {
    private UUID id;
    private String name;
    private String description;
    private UUID userId;
    private List<Position> positions;
    private List<Transaction> transactions;
    private List<Order> orders;
    private BigDecimal allocatedCash;      // Cash available in this portfolio for trading
    private BigDecimal totalAssigned;      // Total historically assigned to this portfolio (only increases)
    private BigDecimal totalWithdrawn;     // Total historically withdrawn from this portfolio (only increases)
        private Double performance = 0.0;
    private boolean isPublic;
    private String shareSlug;

    public BigDecimal getPositionsValue() {
        return positions == null ? BigDecimal.ZERO
                : positions.stream().map(Position::getTotalValue)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public BigDecimal getTotalValue() {
        return getPositionsValue().add(allocatedCash != null ? allocatedCash : BigDecimal.ZERO);
    }
    
    // Explicit getters/setters for Lombok compatibility
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public List<Position> getPositions() { return positions; }
    public void setPositions(List<Position> positions) { this.positions = positions; }
    public List<Transaction> getTransactions() { return transactions; }
    public void setTransactions(List<Transaction> transactions) { this.transactions = transactions; }
    public List<Order> getOrders() { return orders; }
    public void setOrders(List<Order> orders) { this.orders = orders; }
    public BigDecimal getAllocatedCash() { return allocatedCash; }
    public void setAllocatedCash(BigDecimal allocatedCash) { this.allocatedCash = allocatedCash; }
    public BigDecimal getTotalAssigned() { return totalAssigned; }
    public void setTotalAssigned(BigDecimal totalAssigned) { this.totalAssigned = totalAssigned; }
    public BigDecimal getTotalWithdrawn() { return totalWithdrawn; }
    public void setTotalWithdrawn(BigDecimal totalWithdrawn) { this.totalWithdrawn = totalWithdrawn; }
    public Double getPerformance() { return performance; }
    public void setPerformance(Double performance) { this.performance = performance; }
    public boolean getIsPublic() { return isPublic; }
    public void setIsPublic(boolean isPublic) { this.isPublic = isPublic; }
    public void setPublic(boolean isPublic) { this.isPublic = isPublic; }
    public boolean isPublic() { return isPublic; }
    public String getShareSlug() { return shareSlug; }
    public void setShareSlug(String shareSlug) { this.shareSlug = shareSlug; }

        // Helper methods for adding positions/transactions
        public void addPosition(Position position) {
            if (this.positions == null) {
                this.positions = new java.util.ArrayList<>();
            }
            this.positions.add(position);
        }

        public void addTransaction(Transaction transaction) {
            if (this.transactions == null) {
                this.transactions = new java.util.ArrayList<>();
            }
            this.transactions.add(transaction);
        }

        // Explicit no-args constructor for mapping
        public Portfolio() {
            this.positions = new java.util.ArrayList<>();
            this.transactions = new java.util.ArrayList<>();
            this.orders = new java.util.ArrayList<>();
        }

        // Explicit all-args constructor for Lombok compatibility
            public Portfolio(UUID id, String name, String description, UUID userId,
                                 List<Position> positions, List<Transaction> transactions,
                                 List<Order> orders,
                                 BigDecimal allocatedCash, BigDecimal totalAssigned, BigDecimal totalWithdrawn,
                                 Double performance, boolean isPublic, String shareSlug) {
                this.id = id;
                this.name = name;
                this.description = description;
                this.userId = userId;
                this.positions = positions;
                this.transactions = transactions;
                this.orders = orders;
                this.allocatedCash = allocatedCash;
                this.totalAssigned = totalAssigned;
                this.totalWithdrawn = totalWithdrawn;
                this.performance = performance;
                this.isPublic = isPublic;
                this.shareSlug = shareSlug;
            }
    }