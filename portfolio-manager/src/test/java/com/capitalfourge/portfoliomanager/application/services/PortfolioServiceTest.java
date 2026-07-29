package com.capitalfourge.portfoliomanager.application.services;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.capitalfourge.portfoliomanager.application.ports.out.MetricRepository;
import com.capitalfourge.portfoliomanager.application.ports.in.PortfolioUseCase;
import com.capitalfourge.portfoliomanager.application.ports.out.OrderRepository;
import com.capitalfourge.portfoliomanager.application.ports.out.PortfolioRepository;
import com.capitalfourge.portfoliomanager.application.ports.out.TransactionRepository;
import com.capitalfourge.portfoliomanager.application.ports.out.UserRepository;
import com.capitalfourge.portfoliomanager.domain.Order;
import com.capitalfourge.portfoliomanager.domain.OrderStatus;
import com.capitalfourge.portfoliomanager.domain.OrderType;
import com.capitalfourge.portfoliomanager.domain.Portfolio;
import com.capitalfourge.portfoliomanager.domain.Position;
import com.capitalfourge.portfoliomanager.domain.Transaction;
import com.capitalfourge.portfoliomanager.domain.TransactionType;
import com.capitalfourge.portfoliomanager.domain.User;
import com.capitalfourge.portfoliomanager.infrastructure.grpc.GrpcFinancialDataClient;

import lombok.extern.slf4j.Slf4j;

import java.util.UUID;

@ExtendWith(MockitoExtension.class)
@Slf4j
class PortfolioServiceTest {

    @Mock
    private PortfolioRepository portfolioRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private MetricRepository metricRepository;

    @Mock
    private GrpcFinancialDataClient grpcFinancialDataClient;

    @InjectMocks
    private PortfolioService portfolioService;

    private UUID userId;
    private UUID portfolioId;
    private User user;
    private Portfolio portfolio;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        portfolioId = UUID.randomUUID();
        
        user = User.builder()
                .id(userId)
                .email("test@test.com")
                .username("testuser")
                .cashBalance(BigDecimal.ZERO)
                .lockedBalance(BigDecimal.ZERO)
                .build();

        portfolio = Portfolio.builder()
                .id(portfolioId)
                .name("Test Portfolio")
                .userId(userId)
                .positions(new ArrayList<>())
                .transactions(new ArrayList<>())
                .cumulativeDeposits(BigDecimal.ZERO)
                .cumulativeWithdrawals(BigDecimal.ZERO)
                .performance(0.0)
                .build();
    }

    // ==================== BU-01: createPortfolio ====================
    @Test
    void createPortfolio_ShouldSetDefaultsCorrectly() {
        // Given
        Portfolio input = Portfolio.builder()
                .name("New Portfolio")
                .userId(userId)
                .build();

        when(portfolioRepository.save(any(Portfolio.class))).thenAnswer(inv -> inv.getArgument(0));

        // When
        Portfolio result = portfolioService.createPortfolio(input);

        // Then
        assertNotNull(result.getId());
        assertEquals("New Portfolio", result.getName());
        assertEquals(userId, result.getUserId());
        assertNotNull(result.getPositions());
        assertTrue(result.getPositions().isEmpty());
        assertNotNull(result.getTransactions());
        assertTrue(result.getTransactions().isEmpty());
        assertEquals(BigDecimal.ZERO, result.getCumulativeDeposits());
        assertEquals(BigDecimal.ZERO, result.getCumulativeWithdrawals());
        assertEquals(0.0, result.getPerformance());
        assertFalse(result.isPublic());
        verify(metricRepository).recordUserActivity(userId.toString());
        verify(metricRepository).incrementPortfolioCount();
    }

    // ==================== BU-02: getPortfolio ====================
    @Test
    void getPortfolio_ShouldRefreshPricesAndUpdatePerformance() {
        // Given
        Position position = Position.builder()
                .id(UUID.randomUUID())
                .portfolioId(portfolioId)
                .symbol("AAPL")
                .quantity(new BigDecimal("10"))
                .averagePurchasePrice(new BigDecimal("150"))
                .currentPrice(new BigDecimal("150"))
                .build();

        portfolio.setPositions(List.of(position));
        portfolio.setCumulativeDeposits(new BigDecimal("1500"));
        portfolio.setCumulativeWithdrawals(BigDecimal.ZERO);

        when(portfolioRepository.findById(portfolioId)).thenReturn(Optional.of(portfolio));
        when(grpcFinancialDataClient.getBatchPrices(List.of("AAPL"))).thenReturn(Map.of("AAPL", 165.0));

        // When
        Portfolio result = portfolioService.getPortfolio(portfolioId);

        // Then
        assertEquals(165.0, result.getPositions().get(0).getCurrentPrice().doubleValue(), 0.01);
        // Performance: ((1650 + 0) - 1500) / 1500 * 100 = 10%
        assertEquals(10.0, result.getPerformance(), 0.01);
        verify(metricRepository).recordUserActivity(userId.toString());
    }

    @Test
    void getPortfolio_ShouldThrow_WhenNotFound() {
        // Given
        when(portfolioRepository.findById(portfolioId)).thenReturn(Optional.empty());

        // When/Then
        assertThrows(RuntimeException.class, () -> portfolioService.getPortfolio(portfolioId));
    }

    // ==================== BU-03: getPortfoliosByUser ====================
    @Test
    void getPortfoliosByUser_ShouldRefreshPricesAndCalculatePerformance() {
        // Given
        Position position = Position.builder()
                .id(UUID.randomUUID())
                .portfolioId(portfolioId)
                .symbol("AAPL")
                .quantity(new BigDecimal("10"))
                .averagePurchasePrice(new BigDecimal("150"))
                .currentPrice(new BigDecimal("150"))
                .build();

        portfolio.setPositions(List.of(position));
        portfolio.setCumulativeDeposits(new BigDecimal("1500"));

        when(portfolioRepository.findByUserId(userId)).thenReturn(List.of(portfolio));
        when(grpcFinancialDataClient.getBatchPrices(List.of("AAPL"))).thenReturn(Map.of("AAPL", 165.0));

        // When
        List<Portfolio> result = portfolioService.getPortfoliosByUser(userId);

        // Then
        assertEquals(1, result.size());
        assertEquals(165.0, result.get(0).getPositions().get(0).getCurrentPrice().doubleValue(), 0.01);
        assertEquals(10.0, result.get(0).getPerformance(), 0.01);
    }

    // ==================== BU-04: addCash ====================
    @Test
    void addCash_ShouldIncrementUserCashAndPortfolioDeposits() {
        // Given
        BigDecimal amount = new BigDecimal("5000");
        user.setCashBalance(new BigDecimal("10000"));

        when(portfolioRepository.findById(portfolioId)).thenReturn(Optional.of(portfolio));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(portfolioRepository.save(any(Portfolio.class))).thenAnswer(inv -> inv.getArgument(0));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(inv -> inv.getArgument(0));

        // When
        Portfolio result = portfolioService.addCash(portfolioId, amount);

        // Then
        assertEquals(new BigDecimal("15000"), user.getCashBalance()); // 10000 + 5000
        assertEquals(amount, result.getCumulativeDeposits());
        assertEquals(TransactionType.DEPOSIT, result.getTransactions().get(0).getType());
    }

    // ==================== BU-05: withdrawCash ====================
    @Test
    void withdrawCash_ShouldDecrementUserCashAndPortfolioWithdrawals() {
        // Given
        BigDecimal amount = new BigDecimal("3000");
        user.setCashBalance(new BigDecimal("10000"));

        when(portfolioRepository.findById(portfolioId)).thenReturn(Optional.of(portfolio));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(portfolioRepository.save(any(Portfolio.class))).thenAnswer(inv -> inv.getArgument(0));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(inv -> inv.getArgument(0));

        // When
        Portfolio result = portfolioService.withdrawCash(portfolioId, amount);

        // Then
        assertEquals(new BigDecimal("7000"), user.getCashBalance());
        assertEquals(amount, result.getCumulativeWithdrawals());
        assertEquals(TransactionType.WITHDRAWAL, result.getTransactions().get(0).getType());
    }

    @Test
    void withdrawCash_ShouldThrow_WhenInsufficientBalance() {
        // Given
        user.setCashBalance(new BigDecimal("1000"));
        BigDecimal amount = new BigDecimal("5000");

        when(portfolioRepository.findById(portfolioId)).thenReturn(Optional.of(portfolio));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        // When/Then
        assertThrows(RuntimeException.class, () -> portfolioService.withdrawCash(portfolioId, amount));
    }

    // ==================== BU-06: buyAsset ====================
    @Test
    void buyAsset_ShouldDeductCashCreatePositionUpdateDeposits() {
        // Given
        BigDecimal quantity = new BigDecimal("10");
        BigDecimal price = new BigDecimal("150");
        BigDecimal totalCost = price.multiply(quantity); // 1500

        user.setCashBalance(new BigDecimal("10000"));

        when(portfolioRepository.findById(portfolioId)).thenReturn(Optional.of(portfolio));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(portfolioRepository.save(any(Portfolio.class))).thenAnswer(inv -> inv.getArgument(0));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(inv -> inv.getArgument(0));

        // When
        Portfolio result = portfolioService.buyAsset(portfolioId, "AAPL", quantity, price);

        // Then
        assertEquals(new BigDecimal("8500"), user.getCashBalance()); // 10000 - 1500
        assertEquals(1, result.getPositions().size());
        Position pos = result.getPositions().get(0);
        assertEquals("AAPL", pos.getSymbol());
        assertEquals(quantity, pos.getQuantity());
        assertEquals(price, pos.getAveragePurchasePrice());
        assertEquals(totalCost, result.getCumulativeDeposits());
        assertEquals(TransactionType.BUY, result.getTransactions().get(0).getType());
    }

    @Test
    void buyAsset_ShouldAverageDown_WhenPositionExists() {
        // Given - existing position
        Position existing = Position.builder()
                .id(UUID.randomUUID())
                .portfolioId(portfolioId)
                .symbol("AAPL")
                .quantity(new BigDecimal("10"))
                .averagePurchasePrice(new BigDecimal("150"))
                .currentPrice(new BigDecimal("150"))
                .build();

        portfolio.setPositions(new ArrayList<>(List.of(existing)));
        portfolio.setCumulativeDeposits(new BigDecimal("1500"));

        user.setCashBalance(new BigDecimal("10000"));

        // Buy 10 more at 140
        BigDecimal quantity = new BigDecimal("10");
        BigDecimal price = new BigDecimal("140");

        when(portfolioRepository.findById(portfolioId)).thenReturn(Optional.of(portfolio));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(portfolioRepository.save(any(Portfolio.class))).thenAnswer(inv -> inv.getArgument(0));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(inv -> inv.getArgument(0));

        // When
        Portfolio result = portfolioService.buyAsset(portfolioId, "AAPL", quantity, price);

        // Then
        Position pos = result.getPositions().get(0);
        assertEquals(new BigDecimal("20"), pos.getQuantity()); // 10 + 10
        
        // Average: (10*150 + 10*140) / 20 = 2900/20 = 145
        assertEquals(new BigDecimal("145").setScale(8, RoundingMode.HALF_UP), pos.getAveragePurchasePrice());
        assertEquals(new BigDecimal("2900"), result.getCumulativeDeposits()); // 1500 + 1400
    }

    @Test
    void buyAsset_ShouldThrow_WhenInsufficientCash() {
        // Given
        user.setCashBalance(new BigDecimal("500"));
        BigDecimal quantity = new BigDecimal("10");
        BigDecimal price = new BigDecimal("150"); // cost = 1500

        when(portfolioRepository.findById(portfolioId)).thenReturn(Optional.of(portfolio));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        // When/Then
        assertThrows(RuntimeException.class, () -> portfolioService.buyAsset(portfolioId, "AAPL", quantity, price));
    }

    // ==================== BU-07: sellAsset ====================
    @Test
    void sellAsset_ShouldCreditCashReducePositionUpdateWithdrawals() {
        // Given
        Position position = Position.builder()
                .id(UUID.randomUUID())
                .portfolioId(portfolioId)
                .symbol("AAPL")
                .quantity(new BigDecimal("20"))
                .averagePurchasePrice(new BigDecimal("150"))
                .currentPrice(new BigDecimal("160"))
                .build();

        portfolio.setPositions(new ArrayList<>(List.of(position)));
        portfolio.setCumulativeWithdrawals(BigDecimal.ZERO);
        user.setCashBalance(new BigDecimal("5000"));

        when(portfolioRepository.findById(portfolioId)).thenReturn(Optional.of(portfolio));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(portfolioRepository.save(any(Portfolio.class))).thenAnswer(inv -> inv.getArgument(0));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(inv -> inv.getArgument(0));

        // When - sell 10 at 165
        Portfolio result = portfolioService.sellAsset(portfolioId, "AAPL", new BigDecimal("10"), new BigDecimal("165"));

        // Then
        assertEquals(new BigDecimal("6650"), user.getCashBalance()); // 5000 + 1650
        Position updatedPos = result.getPositions().get(0);
        assertEquals(new BigDecimal("10"), updatedPos.getQuantity()); // 20 - 10
        assertEquals(new BigDecimal("1650"), result.getCumulativeWithdrawals());
        assertEquals(TransactionType.SELL, result.getTransactions().get(0).getType());
    }

    @Test
    void sellAsset_ShouldRemovePosition_WhenQuantityZero() {
        // Given
        Position position = Position.builder()
                .id(UUID.randomUUID())
                .portfolioId(portfolioId)
                .symbol("AAPL")
                .quantity(new BigDecimal("10"))
                .averagePurchasePrice(new BigDecimal("150"))
                .currentPrice(new BigDecimal("160"))
                .build();

        portfolio.setPositions(new ArrayList<>(List.of(position)));
        user.setCashBalance(new BigDecimal("5000"));

        when(portfolioRepository.findById(portfolioId)).thenReturn(Optional.of(portfolio));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(portfolioRepository.save(any(Portfolio.class))).thenAnswer(inv -> inv.getArgument(0));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(inv -> inv.getArgument(0));
        when(grpcFinancialDataClient.getBatchPrices(anyList())).thenReturn(Collections.emptyMap());

        // When - sell all 10
        Portfolio result = portfolioService.sellAsset(portfolioId, "AAPL", new BigDecimal("10"), new BigDecimal("165"));

        // Then
        assertTrue(result.getPositions().isEmpty());
    }

    @Test
    void sellAsset_ShouldThrow_WhenNotEnoughAssets() {
        // Given
        Position position = Position.builder()
                .id(UUID.randomUUID())
                .portfolioId(portfolioId)
                .symbol("AAPL")
                .quantity(new BigDecimal("5"))
                .averagePurchasePrice(new BigDecimal("150"))
                .currentPrice(new BigDecimal("160"))
                .build();

        portfolio.setPositions(new ArrayList<>(List.of(position)));

        when(portfolioRepository.findById(portfolioId)).thenReturn(Optional.of(portfolio));

        // When/Then - try to sell 10 when only have 5
        assertThrows(RuntimeException.class, () -> portfolioService.sellAsset(portfolioId, "AAPL", new BigDecimal("10"), new BigDecimal("165")));
    }

    // ==================== BU-08: updatePerformance ====================
    @Test
    void updatePerformance_ShouldCalculateROICorrectly() {
        // Given - Portfolio with:
        // Positions value: $2000 (current prices)
        // Cumulative deposits: $1500
        // Cumulative withdrawals: $200
        // Expected: ((2000 + 200) - 1500) / 1500 * 100 = 46.67%

        Position position = Position.builder()
                .id(UUID.randomUUID())
                .portfolioId(portfolioId)
                .symbol("AAPL")
                .quantity(new BigDecimal("10"))
                .averagePurchasePrice(new BigDecimal("150"))
                .currentPrice(new BigDecimal("200")) // current value = 2000
                .build();

        portfolio.setPositions(new ArrayList<>(List.of(position)));
        portfolio.setCumulativeDeposits(new BigDecimal("1500"));
        portfolio.setCumulativeWithdrawals(new BigDecimal("200"));

        // Use reflection to call private method
        try {
            java.lang.reflect.Method method = PortfolioService.class.getDeclaredMethod("updatePerformance", Portfolio.class);
            method.setAccessible(true);
            method.invoke(portfolioService, portfolio);
        } catch (Exception e) {
            fail("Reflection failed: " + e.getMessage());
        }

        // Then
        // ((2000 + 200) - 1500) / 1500 * 100 = 700/1500 * 100 = 46.666...%
        assertEquals(46.67, portfolio.getPerformance(), 0.01);
    }

    @Test
    void updatePerformance_ShouldHandleZeroDeposits() {
        // Given
        portfolio.setCumulativeDeposits(BigDecimal.ZERO);
        portfolio.setCumulativeWithdrawals(BigDecimal.ZERO);
        portfolio.setPositions(new ArrayList<>());

        try {
            java.lang.reflect.Method method = PortfolioService.class.getDeclaredMethod("updatePerformance", Portfolio.class);
            method.setAccessible(true);
            method.invoke(portfolioService, portfolio);
        } catch (Exception e) {
            fail("Reflection failed: " + e.getMessage());
        }

        // Then - should be 0 when no deposits
        assertEquals(0.0, portfolio.getPerformance());
    }

    // ==================== BU-09: repairUserBalance ====================
    @Test
    void repairUserBalance_ShouldRecoverOrphanedOrdersLockedBalance() {
        // Given
        user.setCashBalance(new BigDecimal("5000"));
        user.setLockedBalance(new BigDecimal("1000")); // 1000 locked in orphaned orders

        UUID orphanPortfolioId = UUID.randomUUID();
        Order orphanOrder = Order.builder()
                .id(UUID.randomUUID())
                .portfolioId(orphanPortfolioId)
                .type(OrderType.BUY_LIMIT)
                .usdAmount(new BigDecimal("500"))
                .status(OrderStatus.PENDING)
                .build();

        UUID anotherOrphanPortfolioId = UUID.randomUUID();
        Order anotherOrphanOrder = Order.builder()
                .id(UUID.randomUUID())
                .portfolioId(anotherOrphanPortfolioId)
                .type(OrderType.BUY_LIMIT)
                .quantity(new BigDecimal("2"))
                .targetPrice(new BigDecimal("250")) // 2 * 250 = 500
                .status(OrderStatus.PENDING)
                .build();

        Order validOrder = Order.builder()
                .id(UUID.randomUUID())
                .portfolioId(portfolioId)
                .type(OrderType.BUY_LIMIT)
                .usdAmount(new BigDecimal("300"))
                .status(OrderStatus.PENDING)
                .build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(orderRepository.findByUserId(userId)).thenReturn(List.of(orphanOrder, anotherOrphanOrder, validOrder));
        when(portfolioRepository.findByIds(List.of(orphanPortfolioId, anotherOrphanPortfolioId, portfolioId)))
                .thenReturn(List.of(portfolio)); // only portfolioId exists
        when(orderRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        // When
        portfolioService.repairUserBalance(userId);

        // Then
        // Orphaned: 500 + 500 = 1000 recovered
        // Then step 7 recalculates locked from valid orders: 300
        // So: cash = 5000 + 1000 - 300 = 5700, locked = 300
        assertEquals(new BigDecimal("5700"), user.getCashBalance()); // 5000 + 1000 - 300
        assertEquals(new BigDecimal("300"), user.getLockedBalance());
        
        // Verify orphaned orders cancelled
        assertEquals(OrderStatus.CANCELLED, orphanOrder.getStatus());
        assertEquals(OrderStatus.CANCELLED, anotherOrphanOrder.getStatus());
        
        // Valid order should remain
        assertEquals(OrderStatus.PENDING, validOrder.getStatus());
    }

    @Test
    void repairUserBalance_ShouldRecalculateLockedBalanceFromValidOrders() {
        // Given
        user.setCashBalance(new BigDecimal("5000"));
        user.setLockedBalance(new BigDecimal("2000")); // Incorrect - should be 800

        Order validOrder1 = Order.builder()
                .id(UUID.randomUUID())
                .portfolioId(portfolioId)
                .type(OrderType.BUY_LIMIT)
                .usdAmount(new BigDecimal("500"))
                .status(OrderStatus.PENDING)
                .build();

        Order validOrder2 = Order.builder()
                .id(UUID.randomUUID())
                .portfolioId(portfolioId)
                .type(OrderType.BUY_LIMIT)
                .quantity(new BigDecimal("1"))
                .targetPrice(new BigDecimal("300"))
                .status(OrderStatus.PENDING)
                .build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(orderRepository.findByUserId(userId)).thenReturn(List.of(validOrder1, validOrder2));
        when(portfolioRepository.findByIds(List.of(portfolioId))).thenReturn(List.of(portfolio));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        // When
        portfolioService.repairUserBalance(userId);

        // Then - Actual locked = 500 + 300 = 800
        // Diff = 2000 - 800 = 1200
        // New cash = 5000 + 1200 = 6200
        // New locked = 800
        assertEquals(new BigDecimal("6200"), user.getCashBalance());
        assertEquals(new BigDecimal("800"), user.getLockedBalance());
    }
}