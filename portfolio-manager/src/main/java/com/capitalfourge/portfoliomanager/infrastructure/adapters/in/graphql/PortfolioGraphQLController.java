package com.capitalfourge.portfoliomanager.infrastructure.adapters.in.graphql;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.GraphQlExceptionHandler;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.graphql.execution.ErrorType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;

import graphql.GraphQLError;
import graphql.schema.DataFetchingEnvironment;

import com.capitalfourge.portfoliomanager.application.ports.dto.auth.AuthResult;
import com.capitalfourge.portfoliomanager.application.ports.dto.auth.LoginCommand;
import com.capitalfourge.portfoliomanager.application.ports.in.PortfolioUseCase;
import com.capitalfourge.portfoliomanager.application.ports.in.UserUseCase;
import com.capitalfourge.portfoliomanager.application.ports.out.UserRepository;
import com.capitalfourge.portfoliomanager.domain.Portfolio;
import com.capitalfourge.portfoliomanager.domain.Role;
import com.capitalfourge.portfoliomanager.domain.User;
import com.capitalfourge.portfoliomanager.infrastructure.grpc.GrpcFinancialDataClient;
import com.capitalfourge.proto.PricePoint;
import com.capitalfourge.proto.StockPriceResponse;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class PortfolioGraphQLController {

    private final GrpcFinancialDataClient grpcClient;
    private final UserUseCase userUseCase;
    private final PortfolioUseCase portfolioUseCase;
    private final UserRepository userRepository;
    private final com.capitalfourge.portfoliomanager.application.services.AssetSearchService assetSearchService;
    private final com.capitalfourge.portfoliomanager.application.services.TechnicalAnalysisService technicalAnalysisService;

    @QueryMapping
    public User me(@AuthenticationPrincipal UUID userId) {
        if (userId == null) {
            return null;
        }

        // Automatically repair and sync balance (recover orphaned funds if any)
        portfolioUseCase.repairUserBalance(userId);

        // Get the actual user from the database to return real cash balance
        User user = userRepository.findById(userId)
                .orElse(User.builder()
                        .id(userId)
                        .username("Usuario_Detectado")
                        .email("token@valido.com")
                        .cashBalance(java.math.BigDecimal.ZERO)
                        .build());

        // Ensure cashBalance and lockedBalance are never null
        if (user.getCashBalance() == null) {
            user.setCashBalance(java.math.BigDecimal.ZERO);
        }
        if (user.getLockedBalance() == null) {
            user.setLockedBalance(java.math.BigDecimal.ZERO);
        }

        return user;
    }

    @QueryMapping
    public List<User> adminUsers(@AuthenticationPrincipal UUID userId) {
        if (userId == null) {
            throw new RuntimeException("Authentication required");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (!user.isAdmin()) {
            throw new RuntimeException("Admin access required");
        }
        return userUseCase.adminGetAllUsers();
    }

    @QueryMapping
    public StockPriceResponse stockPrice(@Argument("symbol") String symbol) {
        double price = grpcClient.getStockPrice(symbol);
        return StockPriceResponse.newBuilder()
                .setSymbol(symbol)
                .setPrice(price)
                .build();
    }

    @MutationMapping
    public AuthResult login(@Argument String email, @Argument String password) {
        return userUseCase.login(new LoginCommand(email, password));
    }

    @QueryMapping
    public List<PricePoint> priceHistory(@Argument("symbol") String symbol, @Argument("days") int days) {
        return grpcClient.getPriceHistory(symbol, days);
    }

    @QueryMapping
    public Portfolio portfolio(@Argument("id") UUID id) {
        return portfolioUseCase.getPortfolio(id);
    }

    @QueryMapping
    public List<Portfolio> portfolios(@AuthenticationPrincipal UUID userId) {
        return portfolioUseCase.getPortfoliosByUser(userId);
    }

    @QueryMapping
    public List<Portfolio> leaderboard() {
        return portfolioUseCase.getPublicLeaderboard();
    }

    @QueryMapping
    public Portfolio sharedPortfolio(@Argument String slug) {
        return portfolioUseCase.getPortfolioBySlug(slug);
    }

    @QueryMapping
    public List<com.capitalfourge.portfoliomanager.application.services.AssetSearchService.AssetSuggestion> searchSymbols(
            @Argument("query") String query, @Argument("limit") Integer limit) {
        return assetSearchService.searchSymbols(query, limit != null ? limit : 5);
    }

    @QueryMapping
    public List<com.capitalfourge.portfoliomanager.application.services.AssetSearchService.AssetInfo> assetsByCategory(
            @Argument("category") String category) {
        return assetSearchService.getCategorizedAssets(category);
    }

    @QueryMapping
    public List<com.capitalfourge.portfoliomanager.application.services.AssetSearchService.AssetMover> assetMovers(
            @Argument("sort") String sort, @Argument("limit") Integer limit) {
        return assetSearchService.getAssetMovers(sort, limit != null ? limit : 8);
    }

    @QueryMapping
    public List<com.capitalfourge.portfoliomanager.application.services.TechnicalAnalysisService.IndicatorSeries> technicalIndicators(
            @Argument("symbol") String symbol, @Argument("days") int days) {
        return technicalAnalysisService.getIndicators(symbol, days);
    }

    @QueryMapping
    public com.capitalfourge.proto.Asset asset(@Argument("symbol") String symbol) {
        com.capitalfourge.portfoliomanager.application.services.AssetSearchService.AssetInfo info = assetSearchService.getAssetInfo(symbol);
        if (info == null) {
            return null;
        }
        return com.capitalfourge.proto.Asset.newBuilder()
                .setSymbol(info.getSymbol())
                .setName(info.getName() != null ? info.getName() : "")
                .setCategory(info.getCategory() != null ? info.getCategory() : "")
                .setDescription(info.getDescription() != null ? info.getDescription() : "")
                .setWebsite(info.getWebsite() != null ? info.getWebsite() : "")
                .build();
    }

    @MutationMapping
    public Portfolio createPortfolio(@Argument("name") String name, @Argument("description") String description,
            @AuthenticationPrincipal UUID userId) {
        if (userId == null) {
            throw new RuntimeException(
                    "ERROR_AUTENTICACION: No se pudo identificar al usuario. Re-ingrese a la terminal.");
        }
        return portfolioUseCase.createPortfolio(Portfolio.builder()
                .name(name)
                .description(description)
                .userId(userId)
                .build());
    }

    @MutationMapping
    public Portfolio buyAsset(@Argument("portfolioId") UUID portfolioId, @Argument("symbol") String symbol,
            @Argument("quantity") BigDecimal quantity,
            @Argument("price") BigDecimal price) {
        return portfolioUseCase.buyAsset(portfolioId, symbol, quantity, price);
    }

    @MutationMapping
    public Portfolio sellAsset(@Argument("portfolioId") UUID portfolioId, @Argument("symbol") String symbol,
            @Argument("quantity") BigDecimal quantity,
            @Argument("price") BigDecimal price) {
        return portfolioUseCase.sellAsset(portfolioId, symbol, quantity, price);
    }

    @MutationMapping
    public Portfolio buyAssetByUSD(@Argument("portfolioId") UUID portfolioId, @Argument("symbol") String symbol,
            @Argument("usdAmount") BigDecimal usdAmount,
            @Argument("price") BigDecimal price) {
        return portfolioUseCase.buyAssetByUSD(portfolioId, symbol, usdAmount, price);
    }

    @MutationMapping
    public Portfolio sellAssetByUSD(@Argument("portfolioId") UUID portfolioId, @Argument("symbol") String symbol,
            @Argument("usdAmount") BigDecimal usdAmount,
            @Argument("price") BigDecimal price) {
        return portfolioUseCase.sellAssetByUSD(portfolioId, symbol, usdAmount, price);
    }

    @MutationMapping
    public Portfolio addCash(@Argument("portfolioId") UUID portfolioId, @Argument("amount") BigDecimal amount) {
        return portfolioUseCase.addCash(portfolioId, amount);
    }

    @MutationMapping
    public Portfolio withdrawCash(@Argument("portfolioId") UUID portfolioId, @Argument("amount") BigDecimal amount) {
        return portfolioUseCase.withdrawCash(portfolioId, amount);
    }

    @MutationMapping
    public User deposit(@Argument("amount") BigDecimal amount, @AuthenticationPrincipal UUID userId) {
        if (userId == null)
            throw new RuntimeException("Unauthorized");
        return userUseCase.deposit(userId, amount);
    }

    @MutationMapping
    public User withdraw(@Argument("amount") BigDecimal amount, @AuthenticationPrincipal UUID userId) {
        if (userId == null)
            throw new RuntimeException("Unauthorized");
        return userUseCase.withdraw(userId, amount);
    }

    @MutationMapping
    public Boolean deletePortfolio(@Argument("id") UUID id) {
        portfolioUseCase.deletePortfolio(id);
        return true;
    }

    @MutationMapping
    public Portfolio toggleVisibility(@Argument UUID portfolioId, @Argument boolean isPublic) {
        return portfolioUseCase.toggleVisibility(portfolioId, isPublic);
    }

    @MutationMapping
    public User adminSetRole(@Argument UUID userId, @Argument String role, @AuthenticationPrincipal UUID currentUserId) {
        if (currentUserId == null) {
            throw new RuntimeException("Authentication required");
        }
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (!currentUser.isAdmin()) {
            throw new RuntimeException("Admin access required");
        }
        userUseCase.adminSetRole(userId, Role.valueOf(role));
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Target user not found"));
    }

    @MutationMapping
    public Boolean adminDeactivateUser(@Argument UUID userId, @AuthenticationPrincipal UUID currentUserId) {
        if (currentUserId == null) {
            throw new RuntimeException("Authentication required");
        }
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (!currentUser.isAdmin()) {
            throw new RuntimeException("Admin access required");
        }
        userUseCase.adminDeactivateUser(userId);
        return true;
    }

    @GraphQlExceptionHandler
    public GraphQLError handle(RuntimeException ex, DataFetchingEnvironment env) {
        return GraphQLError.newError()
                .errorType(ErrorType.BAD_REQUEST)
                .message(ex.getMessage())
                .path(env.getExecutionStepInfo().getPath())
                .location(env.getField().getSourceLocation())
                .build();
    }
}
