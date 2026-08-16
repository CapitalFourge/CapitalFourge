package com.capitalfourge.portfoliomanager.domain;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
public class Portfolio {
    private UUID id;
    private String name;
    private String description;
    private UUID userId;
    private List<Position> positions;
    private List<Transaction> transactions;
    private BigDecimal cumulativeDeposits;
    private BigDecimal cumulativeWithdrawals;
        private Double performance = 0.0;
    private boolean isPublic;
    private String shareSlug;

    public BigDecimal getTotalAccountValue() {
        return positions == null ? BigDecimal.ZERO
                : positions.stream().map(Position::getTotalValue)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
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
    public BigDecimal getCumulativeDeposits() { return cumulativeDeposits; }
    public void setCumulativeDeposits(BigDecimal cumulativeDeposits) { this.cumulativeDeposits = cumulativeDeposits; }
    public BigDecimal getCumulativeWithdrawals() { return cumulativeWithdrawals; }
    public void setCumulativeWithdrawals(BigDecimal cumulativeWithdrawals) { this.cumulativeWithdrawals = cumulativeWithdrawals; }
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

        // Explicit all-args constructor for Lombok compatibility
    public Portfolio(UUID id, String name, String description, UUID userId, 
                     List<Position> positions, List<Transaction> transactions,
                     BigDecimal cumulativeDeposits, BigDecimal cumulativeWithdrawals,
                     Double performance, boolean isPublic, String shareSlug) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.userId = userId;
        this.positions = positions;
        this.transactions = transactions;
        this.cumulativeDeposits = cumulativeDeposits;
        this.cumulativeWithdrawals = cumulativeWithdrawals;
        this.performance = performance;
        this.isPublic = isPublic;
        this.shareSlug = shareSlug;
    }
}