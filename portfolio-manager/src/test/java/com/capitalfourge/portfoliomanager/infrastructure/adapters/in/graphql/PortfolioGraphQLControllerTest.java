package com.capitalfourge.portfoliomanager.infrastructure.adapters.in.graphql;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.capitalfourge.portfoliomanager.application.ports.in.PortfolioUseCase;
import com.capitalfourge.portfoliomanager.application.ports.out.OrderRepository;
import com.capitalfourge.portfoliomanager.application.ports.out.UserRepository;
import com.capitalfourge.portfoliomanager.domain.Portfolio;
import com.capitalfourge.portfoliomanager.infrastructure.adapters.out.datacollector.DataCollectorClient;

@ExtendWith(MockitoExtension.class)
class PortfolioGraphQLControllerTest {

    @Mock
    private PortfolioUseCase portfolioUseCase;

    @Mock
    private UserRepository userRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private DataCollectorClient dataCollectorClient;

    @InjectMocks
    private PortfolioGraphQLController controller;

    @Test
    void leaderboard_returnsPublicPortfoliosFromUseCase() {
        Portfolio portfolio = new Portfolio(
                UUID.randomUUID(),
                "Publica",
                null,
                UUID.randomUUID(),
                List.of(),
                List.of(),
                List.of(),
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                10.0,
                true,
                "publica-12345678");
        List<Portfolio> expected = List.of(portfolio);
        when(portfolioUseCase.getPublicLeaderboard()).thenReturn(expected);

        assertSame(expected, controller.leaderboard());
    }
}
