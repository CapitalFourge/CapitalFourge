package com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence.Mappers;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.Hibernate;

import org.springframework.stereotype.Component;

import com.capitalfourge.portfoliomanager.domain.Portfolio;
import com.capitalfourge.portfoliomanager.domain.Position;
import com.capitalfourge.portfoliomanager.domain.Transaction;
import com.capitalfourge.portfoliomanager.domain.TransactionType;
import com.capitalfourge.portfoliomanager.domain.Order;
import com.capitalfourge.portfoliomanager.domain.OrderStatus;
import com.capitalfourge.portfoliomanager.domain.OrderType;
import com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence.Entities.PortfolioEntity;
import com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence.Entities.PositionEntity;
import com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence.Entities.TransactionEntity;
import com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence.Entities.OrderEntity;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class PortfolioMapper {

    public PortfolioEntity toEntity(Portfolio domain) {
        PortfolioEntity entity = new PortfolioEntity();
        entity.setId(domain.getId());
        entity.setName(domain.getName());
        entity.setDescription(domain.getDescription());
        entity.setUserId(domain.getUserId());
        entity.setCumulativeDeposits(domain.getCumulativeDeposits());
        entity.setCumulativeWithdrawals(domain.getCumulativeWithdrawals());
        entity.setPerformance(domain.getPerformance());
        entity.setPublic(domain.isPublic());
        entity.setShareSlug(domain.getShareSlug());

        if (domain.getPositions() != null) {
            List<PositionEntity> positionEntities = domain.getPositions().stream()
                    .map(pos -> {
                        PositionEntity pe = toEntity(pos);
                        pe.setPortfolio(entity);
                        return pe;
                    })
                    .toList();
            entity.setPositions(positionEntities);
        }

        if (domain.getTransactions() != null) {
            List<TransactionEntity> transactionEntities = domain.getTransactions().stream()
                    .map(t -> {
                        TransactionEntity te = toEntity(t);
                        te.setPortfolio(entity);
                        return te;
                    })
                    .toList();
            entity.setTransactions(transactionEntities);
        }

        if (domain.getOrders() != null) {
            List<OrderEntity> orderEntities = domain.getOrders().stream()
                    .map(this::toEntity)
                    .toList();
            entity.setOrders(orderEntities);
        }

        return entity;
    }

    public Portfolio toDomain(PortfolioEntity entity) {
        Portfolio domain = new Portfolio();
        domain.setId(entity.getId());
        domain.setName(entity.getName());
        domain.setDescription(entity.getDescription());
        domain.setUserId(entity.getUserId());
        domain.setCumulativeDeposits(entity.getCumulativeDeposits());
        domain.setCumulativeWithdrawals(entity.getCumulativeWithdrawals());
        domain.setPerformance(entity.getPerformance());
        domain.setPublic(entity.isPublic());
        domain.setShareSlug(entity.getShareSlug());

        if (entity.getPositions() != null) {
            List<Position> positions = new ArrayList<>(entity.getPositions().stream()
                    .map(this::toDomain)
                    .toList());
            domain.setPositions(positions);
        }

        if (entity.getTransactions() != null && Hibernate.isInitialized(entity.getTransactions()) && entity.getTransactions().size() > 0) {
            List<Transaction> transactions = entity.getTransactions().stream()
                    .map(this::toDomain)
                    .toList();
            domain.setTransactions(transactions);
        }

        if (entity.getOrders() != null && Hibernate.isInitialized(entity.getOrders()) && entity.getOrders().size() > 0) {
            List<Order> orders = entity.getOrders().stream()
                    .map(this::toDomain)
                    .toList();
            domain.setOrders(orders);
        }

        return domain;
    }

    private PositionEntity toEntity(Position domain) {
        PositionEntity entity = new PositionEntity();
        entity.setId(domain.getId());
        entity.setSymbol(domain.getSymbol());
        entity.setQuantity(domain.getQuantity());
        entity.setAveragePurchasePrice(domain.getAveragePurchasePrice());
        entity.setCurrentPrice(domain.getCurrentPrice());
        return entity;
    }

    private Position toDomain(PositionEntity entity) {
        Position domain = new Position();
        domain.setId(entity.getId());
        domain.setPortfolioId(entity.getPortfolio() != null ? entity.getPortfolio().getId() : null);
        domain.setSymbol(entity.getSymbol());
        domain.setQuantity(entity.getQuantity());
        domain.setAveragePurchasePrice(entity.getAveragePurchasePrice());
        domain.setCurrentPrice(entity.getCurrentPrice());
        domain.setLockedQuantity(BigDecimal.ZERO); // Not stored in entity
        return domain;
    }

    private TransactionEntity toEntity(Transaction domain) {
        TransactionEntity entity = new TransactionEntity();
        entity.setId(domain.getId());
        entity.setType(domain.getType());
        entity.setSymbol(domain.getSymbol());
        entity.setQuantity(domain.getQuantity());
        entity.setPrice(domain.getPrice());
        entity.setTimestamp(domain.getTimestamp());
        entity.setBalanceTransaction(domain.getBalanceTransaction());
        return entity;
    }

    private Transaction toDomain(TransactionEntity entity) {
        Transaction domain = new Transaction();
        domain.setId(entity.getId());
        domain.setPortfolioId(entity.getPortfolio() != null ? entity.getPortfolio().getId() : null);
        domain.setType(entity.getType());
        domain.setSymbol(entity.getSymbol());
        domain.setQuantity(entity.getQuantity());
        domain.setPrice(entity.getPrice());
        domain.setTotalAmount(entity.getPrice() != null && entity.getQuantity() != null 
                ? entity.getPrice().multiply(entity.getQuantity()) : BigDecimal.ZERO);
        domain.setTimestamp(entity.getTimestamp());
        domain.setBalanceTransaction(entity.getBalanceTransaction());
        return domain;
    }

    private OrderEntity toEntity(Order domain) {
        OrderEntity entity = new OrderEntity();
        entity.setId(domain.getId());
        entity.setPortfolioId(domain.getPortfolioId());
        entity.setPortfolioName(domain.getPortfolioName()); // Map portfolio name
        entity.setUserId(domain.getUserId());
        entity.setType(domain.getType());
        entity.setSymbol(domain.getSymbol());
        entity.setTargetPrice(domain.getTargetPrice());
        entity.setQuantity(domain.getQuantity());
        entity.setUsdAmount(domain.getUsdAmount());
        entity.setStatus(domain.getStatus());
        entity.setCreatedAt(domain.getCreatedAt());
        entity.setFilledAt(domain.getFilledAt());
        entity.setExpiresAt(domain.getExpiresAt());
        entity.setFilledPrice(domain.getFilledPrice());
        entity.setFilledQuantity(domain.getFilledQuantity());
        entity.setRejectionReason(domain.getRejectionReason());
        return entity;
    }

    private Order toDomain(OrderEntity entity) {
        Order domain = new Order();
        domain.setId(entity.getId());
        domain.setPortfolioId(entity.getPortfolioId());
        domain.setPortfolioName(entity.getPortfolioName()); // Map portfolio name
        domain.setUserId(entity.getUserId());
        domain.setType(entity.getType());
        domain.setSymbol(entity.getSymbol());
        domain.setTargetPrice(entity.getTargetPrice());
        domain.setQuantity(entity.getQuantity());
        domain.setUsdAmount(entity.getUsdAmount());
        domain.setStatus(entity.getStatus());
        domain.setCreatedAt(entity.getCreatedAt());
        domain.setFilledAt(entity.getFilledAt());
        domain.setExpiresAt(entity.getExpiresAt());
        domain.setFilledPrice(entity.getFilledPrice());
        domain.setFilledQuantity(entity.getFilledQuantity());
        domain.setRejectionReason(entity.getRejectionReason());
        return domain;
    }
}