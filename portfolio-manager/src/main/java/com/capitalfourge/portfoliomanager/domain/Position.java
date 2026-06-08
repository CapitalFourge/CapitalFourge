package com.capitalfourge.portfoliomanager.domain;

import java.math.BigDecimal;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Position {

    private UUID id;
    private UUID portfolioId;
    private String symbol;
    private BigDecimal quantity;
    private BigDecimal averagePurchasePrice;
    private BigDecimal currentPrice;
    private BigDecimal lockedQuantity;

    public BigDecimal getTotalValue() {
        return currentPrice.multiply(quantity);
    }

    public BigDecimal getProfitLoss() {
        return currentPrice.subtract(averagePurchasePrice).multiply(quantity);
    }

    public BigDecimal getAvailableQuantity() {
        return quantity.subtract(lockedQuantity != null ? lockedQuantity : BigDecimal.ZERO);
    }
}
