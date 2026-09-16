package com.capitalfourge.portfoliomanager.application.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.web.client.RestClient;

import com.capitalfourge.portfoliomanager.application.ports.out.MetricRepository;
import com.capitalfourge.portfoliomanager.application.ports.out.OrderRepository;
import com.capitalfourge.portfoliomanager.application.ports.out.PortfolioRepository;
import com.capitalfourge.portfoliomanager.application.ports.out.TransactionRepository;
import com.capitalfourge.portfoliomanager.application.ports.out.UserRepository;
import com.capitalfourge.portfoliomanager.domain.Portfolio;

@ExtendWith(MockitoExtension.class)
class PortfolioServiceTest {

    @Mock
    private PortfolioRepository portfolioRepository;

    @Mock
    private MetricRepository metricRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RestClient dataCollectorClient;

    @InjectMocks
    private PortfolioService portfolioService;

    @Test
    void createPortfolio_trimsAndStoresNormalizedName() {
        Portfolio portfolio = portfolio("  Estrategia global  ");

        when(portfolioRepository.save(any(Portfolio.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Portfolio result = portfolioService.createPortfolio(portfolio);

        assertEquals("Estrategia global", result.getName());
    }

    @Test
    void createPortfolio_rejectsBlankName() {
        Portfolio portfolio = portfolio("   ");

        assertThrows(IllegalArgumentException.class, () -> portfolioService.createPortfolio(portfolio));
        verify(portfolioRepository, never()).save(any(Portfolio.class));
    }

    @Test
    void createPortfolio_rejectsPathSeparator() {
        Portfolio portfolio = portfolio("Estrategia/privada");

        assertThrows(IllegalArgumentException.class, () -> portfolioService.createPortfolio(portfolio));
        verify(portfolioRepository, never()).save(any(Portfolio.class));
    }

    @Test
    void getPortfolioByName_usesAuthenticatedUserId() {
        UUID userId = UUID.randomUUID();
        Portfolio portfolio = portfolio("Estrategia global");
        when(portfolioRepository.findByUserIdAndName(userId, portfolio.getName())).thenReturn(Optional.of(portfolio));

        Portfolio result = portfolioService.getPortfolioByName(userId, portfolio.getName());

        assertEquals(portfolio, result);
        verify(portfolioRepository).findByUserIdAndName(userId, portfolio.getName());
    }

    @Test
    void toggleVisibility_retriesWhenShareSlugCollides() {
        UUID portfolioId = UUID.randomUUID();
        Portfolio portfolio = portfolio("Estrategia global");
        portfolio.setId(portfolioId);
        when(portfolioRepository.findById(portfolioId)).thenReturn(Optional.of(portfolio));
        when(portfolioRepository.save(any(Portfolio.class)))
                .thenThrow(new DataIntegrityViolationException("duplicate shareSlug"))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Portfolio result = portfolioService.toggleVisibility(portfolioId, true);

        assertEquals(true, result.isPublic());
        assertTrue(result.getShareSlug().matches("estrategia-global(-\\d+)?"));
        verify(portfolioRepository, times(2)).save(any(Portfolio.class));
    }

    private Portfolio portfolio(String name) {
        return new Portfolio(
                UUID.randomUUID(),
                name,
                "descripcion",
                UUID.randomUUID(),
                List.of(),
                List.of(),
                List.of(),
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                0.0,
                false,
                null);
    }
}
