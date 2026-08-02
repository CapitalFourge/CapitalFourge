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
@NoArgsConstructor
@AllArgsConstructor
@Builder
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
    @Builder.Default
    private List<PositionEntity> positions = new ArrayList<>();

    @OneToMany(mappedBy = "portfolio", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<TransactionEntity> transactions = new ArrayList<>();

    @OneToMany(mappedBy = "portfolio", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<OrderEntity> orders = new ArrayList<>();
}
