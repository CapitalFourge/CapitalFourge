package com.capitalfourge.portfoliomanager.application.services;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.capitalfourge.portfoliomanager.application.ports.in.PortfolioUseCase;
import com.capitalfourge.portfoliomanager.domain.Order;
import com.capitalfourge.portfoliomanager.domain.OrderType;
import com.capitalfourge.portfoliomanager.domain.Portfolio;
import com.capitalfourge.portfoliomanager.domain.User;
import com.capitalfourge.portfoliomanager.application.ports.out.OrderRepository;
import com.capitalfourge.portfoliomanager.application.ports.out.PortfolioRepository;
import com.capitalfourge.portfoliomanager.application.ports.out.UserRepository;
import com.capitalfourge.portfoliomanager.application.ports.out.MetricRepository;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

        @Mock
        private OrderRepository orderRepository;
        @Mock
        private PortfolioRepository portfolioRepository;
        @Mock
        private UserRepository userRepository;
        @Mock
        private PortfolioUseCase portfolioUseCase;
        @Mock
        private MetricRepository metricRepository;
        @Mock
        private com.capitalfourge.portfoliomanager.application.ports.out.TransactionRepository transactionRepository;
        @Mock
        private org.springframework.data.redis.core.RedisTemplate<String, String> redisTemplate;

        @InjectMocks
        private OrderService orderService;

        private User user;
        private Portfolio portfolio;
        private Order order;

        @BeforeEach
        void setUp() {
                UUID userId = UUID.randomUUID();
                UUID portfolioId = UUID.randomUUID();

                user = new User();
                user.setId(userId);
                user.setCashBalance(new BigDecimal("1000"));

                portfolio = Portfolio.builder()
                                .id(portfolioId)
                                .userId(userId)
                                .build();

                order = Order.builder()
                                .id(UUID.randomUUID())
                                .portfolioId(portfolioId)
                                .symbol("AAPL")
                                .type(OrderType.BUY_LIMIT)
                                .targetPrice(new BigDecimal("150"))
                                .quantity(new BigDecimal("1"))
                                .status(com.capitalfourge.portfoliomanager.domain.OrderStatus.PENDING)
                                .expiresAt(java.time.LocalDateTime.now().plusDays(1))
                                .build();
        }

        @Test
        void createLimitOrder_BuyLimit_ShouldLockCash() {
                // Given
                when(portfolioRepository.findById(any())).thenReturn(Optional.of(portfolio));
                when(userRepository.findById(any())).thenReturn(Optional.of(user));
                when(orderRepository.save(any())).thenAnswer(i -> i.getArguments()[0]);

                // When
                Order result = orderService.createLimitOrder(order);

                // Then
                assertEquals(new BigDecimal("850"), user.getCashBalance()); // 1000 - 150
                assertEquals(new BigDecimal("150"), user.getLockedBalance());
                assertEquals(com.capitalfourge.portfoliomanager.domain.OrderStatus.PENDING, result.getStatus());
                verify(userRepository, times(1)).save(user);
        }

        @Test
        void cancelOrder_BuyLimit_ShouldUnlockCashAndRecordTransaction() {
                // Given
                when(orderRepository.findById(any())).thenReturn(Optional.of(order));
                when(portfolioRepository.findById(any())).thenReturn(Optional.of(portfolio));
                when(userRepository.findById(any())).thenReturn(Optional.of(user));
                when(orderRepository.save(any())).thenAnswer(i -> i.getArguments()[0]);
                user.setCashBalance(new BigDecimal("850"));
                user.setLockedBalance(new BigDecimal("150"));

                // When
                orderService.cancelOrder(order.getId());

                // Then
                assertEquals(new BigDecimal("1000"), user.getCashBalance());
                assertEquals(BigDecimal.ZERO, user.getLockedBalance());
                verify(transactionRepository, times(1)).save(any());
        }

        @Test
        void executeOrder_BuyLimit_ShouldRefundReservedAndCallBuyAsset() {
                // Given - simulate state AFTER createLimitOrder was called
                BigDecimal currentPrice = new BigDecimal("145");
                user.setCashBalance(new BigDecimal("850")); // 1000 - 150 (deducted at creation)
                user.setLockedBalance(new BigDecimal("150")); // 150 locked at creation
                
                when(portfolioRepository.findById(order.getPortfolioId())).thenReturn(Optional.of(portfolio));
                when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
                when(orderRepository.findById(any())).thenReturn(Optional.of(order));
                when(orderRepository.save(any())).thenReturn(order);

                // When
                orderService.executeOrder(order.getId(), currentPrice);

                // Then - cashBalance should remain at 850 (already deducted at creation)
                // lockedBalance should go from 150 -> 0
                assertEquals(new BigDecimal("850"), user.getCashBalance());
                assertEquals(BigDecimal.ZERO, user.getLockedBalance());
                verify(portfolioUseCase, times(1)).buyAsset(any(), any(), any(), any());
        }
}
