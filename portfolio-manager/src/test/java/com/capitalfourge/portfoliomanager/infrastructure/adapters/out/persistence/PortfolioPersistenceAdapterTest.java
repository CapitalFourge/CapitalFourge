package com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

import java.math.BigDecimal;
import java.util.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import com.capitalfourge.portfoliomanager.application.ports.out.PortfolioRepository;
import com.capitalfourge.portfoliomanager.domain.Portfolio;
import com.capitalfourge.portfoliomanager.domain.Position;
import com.capitalfourge.portfoliomanager.domain.Transaction;
import com.capitalfourge.portfoliomanager.domain.TransactionType;
import com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence.Entities.PortfolioEntity;
import com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence.Entities.PositionEntity;
import com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence.Entities.TransactionEntity;
import com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence.Repositories.JpaPortfolioRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageImpl;

import java.time.LocalDateTime;
import java.util.UUID;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PortfolioPersistenceAdapterTest {

    @Mock
    private JpaPortfolioRepository jpaRepository;

    @InjectMocks
    private PortfolioPersistenceAdapter adapter;

    private UUID portfolioId;
    private UUID userId;
    private UUID positionId;
    private UUID transactionId;
    private Portfolio portfolio;

    @BeforeEach
    void setUp() {
        portfolioId = UUID.randomUUID();
        userId = UUID.randomUUID();
        positionId = UUID.randomUUID();
        transactionId = UUID.randomUUID();

        Position position = Position.builder()
                .id(positionId)
                .portfolioId(portfolioId)
                .symbol("AAPL")
                .quantity(new BigDecimal("10"))
                .averagePurchasePrice(new BigDecimal("150"))
                .currentPrice(new BigDecimal("165"))
                .build();

        Transaction transaction = Transaction.builder()
                .id(transactionId)
                .portfolioId(portfolioId)
                .type(TransactionType.BUY)
                .symbol("AAPL")
                .quantity(new BigDecimal("10"))
                .price(new BigDecimal("150"))
                .timestamp(LocalDateTime.now())
                .balanceTransaction(new BigDecimal("10000"))
                .build();

        portfolio = Portfolio.builder()
                .id(portfolioId)
                .name("Test Portfolio")
                .description("Test Description")
                .userId(userId)
                .positions(List.of(position))
                .transactions(List.of(transaction))
                .cumulativeDeposits(new BigDecimal("1500"))
                .cumulativeWithdrawals(BigDecimal.ZERO)
                .performance(10.0)
                .isPublic(false)
                .shareSlug("test-portfolio-abc123")
                .build();
    }

    // ==================== BU-12: Roundtrip save -> findById ====================
    @Test
    void save_AndFindById_ShouldMaintainAllFields() {
        // Given
        PortfolioEntity entity = PortfolioEntity.builder()
                .id(portfolioId)
                .name("Test Portfolio")
                .description("Test Description")
                .userId(userId)
                .cumulativeDeposits(new BigDecimal("1500"))
                .cumulativeWithdrawals(BigDecimal.ZERO)
                .performance(10.0)
                .isPublic(false)
                .shareSlug("test-portfolio-abc123")
                .build();

        PositionEntity positionEntity = PositionEntity.builder()
                .id(positionId)
                .portfolio(entity)
                .symbol("AAPL")
                .quantity(new BigDecimal("10"))
                .averagePurchasePrice(new BigDecimal("150"))
                .currentPrice(new BigDecimal("165"))
                .build();

        entity.setPositions(List.of(positionEntity));

        TransactionEntity transactionEntity = TransactionEntity.builder()
                .id(transactionId)
                .portfolio(entity)
                .type(TransactionType.BUY)
                .symbol("AAPL")
                .quantity(new BigDecimal("10"))
                .price(new BigDecimal("150"))
                .timestamp(LocalDateTime.now())
                .balanceTransaction(new BigDecimal("10000"))
                .build();

        entity.setTransactions(List.of(transactionEntity));

        when(jpaRepository.save(any(PortfolioEntity.class))).thenReturn(entity);
        when(jpaRepository.findByIdWithPositionsAndTransactions(portfolioId)).thenReturn(Optional.of(entity));

        // When - Save
        Portfolio saved = adapter.save(portfolio);

        // Then - Save
        assertEquals(portfolioId, saved.getId());
        assertEquals("Test Portfolio", saved.getName());
        assertEquals(userId, saved.getUserId());
        assertEquals(new BigDecimal("1500"), saved.getCumulativeDeposits());
        assertEquals(10.0, saved.getPerformance(), 0.01);

        // When - Find by ID
        Optional<Portfolio> found = adapter.findById(portfolioId);

        // Then - Find by ID
        assertTrue(found.isPresent());
        Portfolio result = found.get();
        
        // Verify all fields persisted correctly
        assertEquals(portfolioId, result.getId());
        assertEquals("Test Portfolio", result.getName());
        assertEquals("Test Description", result.getDescription());
        assertEquals(userId, result.getUserId());
        assertEquals(new BigDecimal("1500"), result.getCumulativeDeposits());
        assertEquals(BigDecimal.ZERO, result.getCumulativeWithdrawals());
        assertEquals(10.0, result.getPerformance(), 0.01);
        assertFalse(result.isPublic());
        assertEquals("test-portfolio-abc123", result.getShareSlug());
        
        // Verify positions
        assertEquals(1, result.getPositions().size());
        Position pos = result.getPositions().get(0);
        assertEquals(positionId, pos.getId());
        assertEquals(portfolioId, pos.getPortfolioId());
        assertEquals("AAPL", pos.getSymbol());
        assertEquals(new BigDecimal("10"), pos.getQuantity());
        assertEquals(new BigDecimal("150"), pos.getAveragePurchasePrice());
        assertEquals(new BigDecimal("165"), pos.getCurrentPrice());
        
        // Verify transactions
        assertEquals(1, result.getTransactions().size());
        Transaction tx = result.getTransactions().get(0);
        assertEquals(transactionId, tx.getId());
        assertEquals(portfolioId, tx.getPortfolioId());
        assertEquals(TransactionType.BUY, tx.getType());
        assertEquals("AAPL", tx.getSymbol());
    }

    @Test
    void findById_ShouldReturnEmpty_WhenNotFound() {
        // Given
        when(jpaRepository.findById(portfolioId)).thenReturn(Optional.empty());

        // When
        Optional<Portfolio> result = adapter.findById(portfolioId);

        // Then
        assertFalse(result.isPresent());
    }

    @Test
    void findByUserId_ShouldReturnUserPortfolios() {
        // Given
        PortfolioEntity entity = PortfolioEntity.builder()
                .id(portfolioId)
                .name("Test Portfolio")
                .userId(userId)
                .cumulativeDeposits(BigDecimal.ZERO)
                .cumulativeWithdrawals(BigDecimal.ZERO)
                .performance(0.0)
                .isPublic(false)
                .build();

        Page<PortfolioEntity> page = new PageImpl<>(List.of(entity));
        when(jpaRepository.findByUserId(eq(userId), any(Pageable.class))).thenReturn(page);

        // When
        List<Portfolio> result = adapter.findByUserId(userId);

        // Then
        assertEquals(1, result.size());
        assertEquals(portfolioId, result.get(0).getId());
        assertEquals(userId, result.get(0).getUserId());
    }

    @Test
    void findByShareSlug_ShouldReturnPortfolio_WhenFound() {
        // Given
        String slug = "test-portfolio-abc123";
        PortfolioEntity entity = PortfolioEntity.builder()
                .id(portfolioId)
                .name("Test Portfolio")
                .userId(userId)
                .shareSlug(slug)
                .build();

        when(jpaRepository.findByShareSlug(slug)).thenReturn(Optional.of(entity));

        // When
        Optional<Portfolio> result = adapter.findByShareSlug(slug);

        // Then
        assertTrue(result.isPresent());
        assertEquals(slug, result.get().getShareSlug());
    }

    @Test
    void findPublicPortfolios_ShouldReturnSortedByPerformance() {
        // Given
        PortfolioEntity p1 = PortfolioEntity.builder()
                .id(UUID.randomUUID())
                .name("Portfolio 1")
                .userId(userId)
                .performance(15.0)
                .isPublic(true)
                .build();

        PortfolioEntity p2 = PortfolioEntity.builder()
                .id(UUID.randomUUID())
                .name("Portfolio 2")
                .userId(userId)
                .performance(10.0)
                .isPublic(true)
                .build();

        Page<PortfolioEntity> page = new PageImpl<>(List.of(p1, p2));
        when(jpaRepository.findByIsPublicTrueOrderByPerformanceDesc(any(Pageable.class))).thenReturn(page);

        // When
        List<Portfolio> result = adapter.findPublicPortfolios();

        // Then
        assertEquals(2, result.size());
        assertEquals(15.0, result.get(0).getPerformance(), 0.01);
        assertEquals(10.0, result.get(1).getPerformance(), 0.01);
    }

    @Test
    void deleteById_ShouldCallRepository() {
        // When
        adapter.deleteById(portfolioId);

        // Then
        verify(jpaRepository).deleteById(portfolioId);
    }

    @Test
    void findByIds_ShouldReturnMatchingPortfolios() {
        // Given
        UUID id1 = UUID.randomUUID();
        UUID id2 = UUID.randomUUID();
        
        PortfolioEntity e1 = PortfolioEntity.builder().id(id1).name("P1").userId(userId).build();
        PortfolioEntity e2 = PortfolioEntity.builder().id(id2).name("P2").userId(userId).build();

        when(jpaRepository.findByIdIn(List.of(id1, id2))).thenReturn(List.of(e1, e2));

        // When
        List<Portfolio> result = adapter.findByIds(List.of(id1, id2));

        // Then
        assertEquals(2, result.size());
    }

    @Test
    void findByIds_ShouldReturnEmpty_WhenNullOrEmpty() {
        // When/Then
        assertTrue(adapter.findByIds(null).isEmpty());
        assertTrue(adapter.findByIds(Collections.emptyList()).isEmpty());
    }
}