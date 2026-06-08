package com.capitalfourge.portfoliomanager.domain;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Portfolio {
    private UUID id;
    private String name;
    private String description;
    private UUID userId;
    private List<Position> positions;
    private List<Transaction> transactions;
    private BigDecimal cumulativeDeposits;
    private BigDecimal cumulativeWithdrawals;
    private Double performance;
    private boolean isPublic;
    private String shareSlug;

    public BigDecimal getTotalAccountValue() {
        return positions == null ? BigDecimal.ZERO
                : positions.stream().map(Position::getTotalValue)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
