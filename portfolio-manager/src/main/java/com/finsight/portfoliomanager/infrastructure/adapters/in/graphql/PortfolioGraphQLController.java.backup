package com.finsight.portfoliomanager.infrastructure.adapters.in.graphql;

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

import com.finsight.portfoliomanager.application.ports.dto.auth.AuthResult;
import com.finsight.portfoliomanager.application.ports.dto.auth.LoginCommand;
import com.finsight.portfoliomanager.application.ports.in.PortfolioUseCase;
import com.finsight.portfoliomanager.application.ports.in.UserUseCase;
import com.finsight.portfoliomanager.application.ports.out.UserRepository;
import com.finsight.portfoliomanager.domain.Portfolio;
import com.finsight.portfoliomanager.domain.User;
import com.finsight.portfoliomanager.infrastructure.grpc.GrpcFinancialDataClient;
import com.finsight.proto.PricePoint;
import com.finsight.proto.StockPriceResponse;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class PortfolioGraphQLController {

    private final GrpcFinancialDataClient grpcClient;
    private final UserUseCase userUseCase;
    private final PortfolioUseCase portfolioUseCase;
    private final UserRepository userRepository;
    private final com.finsight.portfoliomanager.application.services.AssetSearchService assetSearchService;
    private final com.finsight.portfoliomanager.application.services.TechnicalAnalysisService technicalAnalysisService;

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
    public List<com.finsight.portfoliomanager.application.services.AssetSearchService.AssetSuggestion> searchSymbols(
            @Argument("query") String query, @Argument("limit") Integer limit) {
        return assetSearchService.searchSymbols(query, limit != null ? limit : 5);
    }

    @QueryMapping
    public List<com.finsight.portfoliomanager.application.services.AssetSearchService.AssetInfo> assetsByCategory(
            @Argument("category") String category) {
        return assetSearchService.getCategorizedAssets(category);
    }

    @QueryMapping
    public List<com.finsight.portfoliomanager.application.services.AssetSearchService.AssetMover> assetMovers(
            @Argument("sort") String sort, @Argument("limit") Integer limit) {
        return assetSearchService.getAssetMovers(sort, limit != null ? limit : 8);
    }

    @QueryMapping
    public List<com.finsight.portfoliomanager.application.services.TechnicalAnalysisService.IndicatorSeries> technicalIndicators(
            @Argument("symbol") String symbol, @Argument("days") int days) {
        return technicalAnalysisService.getIndicators(symbol, days);
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
