package com.capitalfourge.portfoliomanager.integration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import com.redis.testcontainers.RedisContainer;

import com.capitalfourge.portfoliomanager.domain.Portfolio;
import com.capitalfourge.portfoliomanager.domain.Position;
import com.capitalfourge.portfoliomanager.domain.Transaction;
import com.capitalfourge.portfoliomanager.domain.TransactionType;
import com.capitalfourge.portfoliomanager.application.ports.out.PortfolioRepository;
import com.capitalfourge.portfoliomanager.application.ports.out.UserRepository;
import com.capitalfourge.portfoliomanager.domain.Role;
import com.capitalfourge.portfoliomanager.domain.User;

@Testcontainers
@SpringBootTest
@TestPropertySource(properties = {
    "jwt.secret=test-secret-key-for-testing-only-minimum-256-bits-length-required",
    "jwt.issuer=capital-fourge-test",
    "jwt.access-expiration-ms=86400000",
    "jwt.refresh-expiration-ms=604800000",
    "spring.profiles.active=test",
    "spring.datasource.driver-class-name=org.postgresql.Driver",
    "spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect"
})
class PortfolioIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
            .withDatabaseName("testdb")
            .withUsername("test")
            .withPassword("test");

    @Container
    static RedisContainer redis = new RedisContainer("redis:7-alpine");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.redis.host", redis::getHost);
        registry.add("spring.redis.port", redis::getFirstMappedPort);
        registry.add("spring.redis.ssl.enabled", () -> "false");
    }

    @Autowired
    private PortfolioRepository portfolioRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    void shouldSaveAndRetrievePortfolio() {
        // Given
        User user = User.builder()
                .email("test@example.com")
                .username("testuser")
                .password("password")
                .role(Role.USER)
                .active(true)
                .cashBalance(new BigDecimal("10000"))
                .lockedBalance(BigDecimal.ZERO)
                .build();
        userRepository.save(user);

        Portfolio portfolio = Portfolio.builder()
                .id(UUID.randomUUID())
                .name("Test Portfolio")
                .description("Integration test portfolio")
                .userId(user.getId())
                .cumulativeDeposits(BigDecimal.ZERO)
                .cumulativeWithdrawals(BigDecimal.ZERO)
                .performance(0.0)
                .isPublic(false)
                .build();

        // When
        Portfolio saved = portfolioRepository.save(portfolio);

        // Then
        assertNotNull(saved.getId());
        assertEquals("Test Portfolio", saved.getName());
        assertEquals(user.getId(), saved.getUserId());

        // Retrieve
        Portfolio found = portfolioRepository.findById(saved.getId()).orElseThrow();
        assertEquals(saved.getId(), found.getId());
        assertEquals("Test Portfolio", found.getName());
    }

    @Test
    void shouldSavePortfolioWithPositionsAndTransactions() {
        // Given
        User user = User.builder()
                .email("test2@example.com")
                .username("testuser2")
                .password("password")
                .role(Role.USER)
                .active(true)
                .cashBalance(new BigDecimal("10000"))
                .lockedBalance(BigDecimal.ZERO)
                .build();
        userRepository.save(user);

        UUID portfolioId = UUID.randomUUID();
        Portfolio portfolio = Portfolio.builder()
                .id(portfolioId)
                .name("Portfolio with Positions")
                .userId(user.getId())
                .cumulativeDeposits(BigDecimal.ZERO)
                .cumulativeWithdrawals(BigDecimal.ZERO)
                .performance(0.0)
                .isPublic(false)
                .positions(java.util.List.of(
                        Position.builder()
                                .id(UUID.randomUUID())
                                .portfolioId(portfolioId)
                                .symbol("AAPL")
                                .quantity(new BigDecimal("10"))
                                .averagePurchasePrice(new BigDecimal("150"))
                                .currentPrice(new BigDecimal("155"))
                                .build()))
                .transactions(java.util.List.of(
                        Transaction.builder()
                                .id(UUID.randomUUID())
                                .portfolioId(portfolioId)
                                .type(TransactionType.BUY)
                                .symbol("AAPL")
                                .quantity(new BigDecimal("10"))
                                .price(new BigDecimal("150"))
                                .totalAmount(new BigDecimal("1500"))
                                .timestamp(java.time.LocalDateTime.now())
                                .build()))
                .build();

        // When
        Portfolio saved = portfolioRepository.save(portfolio);

        // Then
        assertNotNull(saved.getId());
        assertTrue(saved.getPositions().size() >= 1);
        assertTrue(saved.getTransactions().size() >= 1);
    }
}