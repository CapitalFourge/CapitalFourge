package com.capitalfourge.portfoliomanager.infrastructure.adapters.in.graphql;

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

import com.capitalfourge.portfoliomanager.application.ports.dto.auth.AuthResult;
import com.capitalfourge.portfoliomanager.application.ports.in.PortfolioUseCase;
import com.capitalfourge.portfoliomanager.application.ports.in.UserUseCase;
import com.capitalfourge.portfoliomanager.application.ports.out.UserRepository;
import com.capitalfourge.portfoliomanager.domain.Portfolio;
import com.capitalfourge.portfoliomanager.domain.Role;
import com.capitalfourge.portfoliomanager.domain.User;

import java.util.UUID;

@ExtendWith(MockitoExtension.class)
class PortfolioGraphQLControllerTest {

    @Mock
    private PortfolioUseCase portfolioUseCase;
    @Mock
    private UserUseCase userUseCase;
    @Mock
    private UserRepository userRepository;
    @Mock
    private com.capitalfourge.portfoliomanager.application.services.AssetSearchService assetSearchService;
    @Mock
    private com.capitalfourge.portfoliomanager.application.services.TechnicalAnalysisService technicalAnalysisService;
    @Mock
    private com.capitalfourge.portfoliomanager.infrastructure.grpc.GrpcFinancialDataClient grpcClient;

    @InjectMocks
    private PortfolioGraphQLController controller;

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
                .username("testuser")
                .email("test@test.com")
                .role(Role.USER)
                .cashBalance(new BigDecimal("10000"))
                .lockedBalance(BigDecimal.ZERO)
                .active(true)
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
                .isPublic(false)
                .build();
    }

    // ==================== BU-10: me() calls repairUserBalance before returning ====================
    @Test
    void me_ShouldCallRepairUserBalanceAndReturnUser() {
        // Given
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        // When
        User result = controller.me(userId);

        // Then
        assertNotNull(result);
        assertEquals(userId, result.getId());
        assertEquals("testuser", result.getUsername());
        assertEquals(new BigDecimal("10000"), result.getCashBalance());
        
        // Verify repairUserBalance was called
        verify(portfolioUseCase).repairUserBalance(userId);
        verify(userRepository).findById(userId);
    }

    @Test
    void me_ShouldReturnNull_WhenUserIdNull() {
        // When
        User result = controller.me(null);

        // Then
        assertNull(result);
        verifyNoInteractions(portfolioUseCase, userRepository);
    }

    @Test
    void me_ShouldReturnDefaultUser_WhenUserNotFound() {
        // Given
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        // When
        User result = controller.me(userId);

        // Then
        assertNotNull(result);
        assertEquals(userId, result.getId());
        assertEquals("Usuario_Detectado", result.getUsername());
        assertEquals("token@valido.com", result.getEmail());
        assertEquals(BigDecimal.ZERO, result.getCashBalance());
        assertEquals(BigDecimal.ZERO, result.getLockedBalance());
        
        verify(portfolioUseCase).repairUserBalance(userId);
    }

    // ==================== BU-11: portfolios() returns portfolios with refreshed prices ====================
    @Test
    void portfolios_ShouldReturnPortfoliosWithRefreshedPrices() {
        // Given
        List<Portfolio> portfolios = List.of(portfolio);
        when(portfolioUseCase.getPortfoliosByUser(userId)).thenReturn(portfolios);

        // When
        List<Portfolio> result = controller.portfolios(userId);

        // Then
        assertEquals(1, result.size());
        assertEquals(portfolioId, result.get(0).getId());
        verify(portfolioUseCase).getPortfoliosByUser(userId);
    }

    // ==================== GI-06: Cache invalidation after mutations ====================
    @Test
    void addCash_ShouldUpdateUserCashAndPortfolio() {
        // Given
        BigDecimal amount = new BigDecimal("5000");
        when(portfolioUseCase.addCash(portfolioId, amount)).thenReturn(portfolio);

        // When
        Portfolio result = controller.addCash(portfolioId, amount);

        // Then
        assertEquals(portfolio, result);
        verify(portfolioUseCase).addCash(portfolioId, amount);
    }

    @Test
    void withdrawCash_ShouldUpdateUserCashAndPortfolio() {
        // Given
        BigDecimal amount = new BigDecimal("3000");
        when(portfolioUseCase.withdrawCash(portfolioId, amount)).thenReturn(portfolio);

        // When
        Portfolio result = controller.withdrawCash(portfolioId, amount);

        // Then
        assertEquals(portfolio, result);
        verify(portfolioUseCase).withdrawCash(portfolioId, amount);
    }

    @Test
    void buyAsset_ShouldDeductCashAndCreatePosition() {
        // Given
        BigDecimal quantity = new BigDecimal("10");
        BigDecimal price = new BigDecimal("150");
        when(portfolioUseCase.buyAsset(portfolioId, "AAPL", quantity, price)).thenReturn(portfolio);

        // When
        Portfolio result = controller.buyAsset(portfolioId, "AAPL", quantity, price);

        // Then
        assertEquals(portfolio, result);
        verify(portfolioUseCase).buyAsset(portfolioId, "AAPL", quantity, price);
    }

    @Test
    void sellAsset_ShouldCreditCashAndReducePosition() {
        // Given
        BigDecimal quantity = new BigDecimal("10");
        BigDecimal price = new BigDecimal("165");
        when(portfolioUseCase.sellAsset(portfolioId, "AAPL", quantity, price)).thenReturn(portfolio);

        // When
        Portfolio result = controller.sellAsset(portfolioId, "AAPL", quantity, price);

        // Then
        assertEquals(portfolio, result);
        verify(portfolioUseCase).sellAsset(portfolioId, "AAPL", quantity, price);
    }

    @Test
    void buyAssetByUSD_ShouldCalculateQuantityAndBuy() {
        // Given
        BigDecimal usdAmount = new BigDecimal("1500");
        BigDecimal price = new BigDecimal("150");
        when(portfolioUseCase.buyAssetByUSD(portfolioId, "AAPL", usdAmount, price)).thenReturn(portfolio);

        // When
        Portfolio result = controller.buyAssetByUSD(portfolioId, "AAPL", usdAmount, price);

        // Then
        assertEquals(portfolio, result);
        verify(portfolioUseCase).buyAssetByUSD(portfolioId, "AAPL", usdAmount, price);
    }

    @Test
    void sellAssetByUSD_ShouldCalculateQuantityAndSell() {
        // Given
        BigDecimal usdAmount = new BigDecimal("1650");
        BigDecimal price = new BigDecimal("165");
        when(portfolioUseCase.sellAssetByUSD(portfolioId, "AAPL", usdAmount, price)).thenReturn(portfolio);

        // When
        Portfolio result = controller.sellAssetByUSD(portfolioId, "AAPL", usdAmount, price);

        // Then
        assertEquals(portfolio, result);
        verify(portfolioUseCase).sellAssetByUSD(portfolioId, "AAPL", usdAmount, price);
    }

    @Test
    void createPortfolio_ShouldCreateAndReturn() {
        // Given
        String name = "New Portfolio";
        String description = "Description";
        when(portfolioUseCase.createPortfolio(any(Portfolio.class))).thenReturn(portfolio);

        // When
        Portfolio result = controller.createPortfolio(name, description, userId);

        // Then
        assertEquals(portfolio, result);
        verify(portfolioUseCase).createPortfolio(argThat(p -> 
            p.getName().equals(name) && 
            p.getDescription().equals(description) &&
            p.getUserId().equals(userId)
        ));
    }

    @Test
    void createPortfolio_ShouldThrow_WhenUserIdNull() {
        // When/Then
        assertThrows(RuntimeException.class, () -> 
            controller.createPortfolio("Test", "Desc", null)
        );
    }

    @Test
    void deletePortfolio_ShouldCallUseCase() {
        // When
        Boolean result = controller.deletePortfolio(portfolioId);

        // Then
        assertTrue(result);
        verify(portfolioUseCase).deletePortfolio(portfolioId);
    }

    @Test
    void toggleVisibility_ShouldUpdatePortfolio() {
        // Given
        when(portfolioUseCase.toggleVisibility(portfolioId, true)).thenReturn(portfolio);

        // When
        Portfolio result = controller.toggleVisibility(portfolioId, true);

        // Then
        assertEquals(portfolio, result);
        verify(portfolioUseCase).toggleVisibility(portfolioId, true);
    }

    @Test
    void leaderboard_ShouldReturnPublicPortfoliosSortedByPerformance() {
        // Given
        Portfolio p1 = Portfolio.builder().id(UUID.randomUUID()).name("P1").performance(15.0).isPublic(true).build();
        Portfolio p2 = Portfolio.builder().id(UUID.randomUUID()).name("P2").performance(10.0).isPublic(true).build();
        when(portfolioUseCase.getPublicLeaderboard()).thenReturn(List.of(p1, p2));

        // When
        List<Portfolio> result = controller.leaderboard();

        // Then
        assertEquals(2, result.size());
        assertEquals("P1", result.get(0).getName()); // Higher performance first
        verify(portfolioUseCase).getPublicLeaderboard();
    }

    @Test
    void sharedPortfolio_ShouldReturnPortfolio_WhenPublic() {
        // Given
        String slug = "test-portfolio-abc123";
        portfolio.setPublic(true);
        portfolio.setShareSlug(slug);
        when(portfolioUseCase.getPortfolioBySlug(slug)).thenReturn(portfolio);

        // When
        Portfolio result = controller.sharedPortfolio(slug);

        // Then
        assertEquals(portfolio, result);
        verify(portfolioUseCase).getPortfolioBySlug(slug);
    }

    @Test
    void sharedPortfolio_ShouldThrow_WhenNotPublic() {
        // Given
        String slug = "test-portfolio-abc123";
        portfolio.setPublic(false);
        when(portfolioUseCase.getPortfolioBySlug(slug))
            .thenThrow(new RuntimeException("This portfolio is no longer public."));

        // When/Then
        assertThrows(RuntimeException.class, () -> controller.sharedPortfolio(slug));
    }

    @Test
    void adminUsers_ShouldRequireAdmin() {
        // Given
        User admin = User.builder().id(UUID.randomUUID()).role(Role.ADMIN).active(true).build();
        User target = User.builder().id(UUID.randomUUID()).role(Role.USER).build();
        when(userRepository.findById(admin.getId())).thenReturn(Optional.of(admin));
        when(userUseCase.adminGetAllUsers()).thenReturn(List.of(target));

        // When
        List<User> result = controller.adminUsers(admin.getId());

        // Then
        assertEquals(1, result.size());
        verify(userUseCase).adminGetAllUsers();
    }

    @Test
    void adminUsers_ShouldThrow_WhenNotAdmin() {
        // Given
        User regular = User.builder().id(userId).role(Role.USER).active(true).build();
        when(userRepository.findById(userId)).thenReturn(Optional.of(regular));

        // When/Then
        assertThrows(RuntimeException.class, () -> controller.adminUsers(userId));
    }

    @Test
    void adminSetRole_ShouldRequireAdmin() {
        // Given
        User admin = User.builder().id(UUID.randomUUID()).role(Role.ADMIN).active(true).build();
        User target = User.builder().id(UUID.randomUUID()).role(Role.USER).build();
        when(userRepository.findById(admin.getId())).thenReturn(Optional.of(admin));
        when(userRepository.findById(target.getId())).thenReturn(Optional.of(target));

        // When
        User result = controller.adminSetRole(target.getId(), "ADMIN", admin.getId());

        // Then
        assertEquals(target.getId(), result.getId());
        verify(userUseCase).adminSetRole(target.getId(), Role.ADMIN);
    }

    @Test
    void adminDeactivateUser_ShouldRequireAdmin() {
        // Given
        User admin = User.builder().id(UUID.randomUUID()).role(Role.ADMIN).active(true).build();
        when(userRepository.findById(admin.getId())).thenReturn(Optional.of(admin));

        // When
        Boolean result = controller.adminDeactivateUser(userId, admin.getId());

        // Then
        assertTrue(result);
        verify(userUseCase).adminDeactivateUser(userId);
    }
}