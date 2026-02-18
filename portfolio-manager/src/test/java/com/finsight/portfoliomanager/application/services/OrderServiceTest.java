package com.finsight.portfoliomanager.application.services;

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

import com.finsight.portfoliomanager.application.ports.in.PortfolioUseCase;
import com.finsight.portfoliomanager.domain.Order;
import com.finsight.portfoliomanager.domain.OrderType;
import com.finsight.portfoliomanager.domain.Portfolio;
import com.finsight.portfoliomanager.domain.User;
import com.finsight.portfoliomanager.infrastructure.adapters.out.persistence.OrderRepository;
import com.finsight.portfoliomanager.infrastructure.adapters.out.persistence.PortfolioRepository;
import com.finsight.portfoliomanager.infrastructure.adapters.out.persistence.UserRepository;
import com.finsight.portfoliomanager.infrastructure.adapters.out.persistence.MetricRepository;

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

    @InjectMocks
    private OrderService orderService;

    private User user;
    private Portfolio portfolio;
    private Order order;

    @BeforeEach
    void setUp() {
        UUID userId = UUID.randomUUID();
        UUID portfolioId = UUID.randomUUID();

        user = User.builder()
                .id(userId)
                .cashBalance(new BigDecimal("1000"))
                .build();

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
                .status(com.finsight.portfoliomanager.domain.OrderStatus.PENDING)
                .build();
    }

    @Test
    void executeOrder_BuyLimit_ShouldRefundReservedAndCallBuyAsset() {
        // Given
        BigDecimal currentPrice = new BigDecimal("145"); // Better than target price
        when(portfolioRepository.findById(order.getPortfolioId())).thenReturn(Optional.of(portfolio));
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(orderRepository.save(any())).thenReturn(order);

        // When
        orderService.executeOrder(order.getId(), currentPrice);

        // Then
        // Verified: The user balance should have been temporarily increased by reserved
        // amount (150)
        // OrderService logic: currentBalance + reservedAmount
        // In this test: 1000 + 150 = 1150
        assertEquals(new BigDecimal("1150"), user.getCashBalance());

        verify(userRepository, times(1)).save(user);
        verify(portfolioUseCase, times(1)).buyAsset(eq(portfolio.getId()), eq("AAPL"), eq(new BigDecimal("1")),
                eq(currentPrice));
    }
}
