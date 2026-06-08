package com.capitalfourge.portfoliomanager.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
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
    private LocalDateTime expiresAt;
    private BigDecimal filledPrice;
    private BigDecimal filledQuantity;
    private String rejectionReason;
}
