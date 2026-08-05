package com.capitalfourge.portfoliomanager.infrastructure.adapters.in.graphql;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.GraphQlExceptionHandler;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.graphql.data.method.annotation.SchemaMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;

import graphql.GraphQLError;
import graphql.schema.DataFetchingEnvironment;

import com.capitalfourge.portfoliomanager.application.ports.dto.auth.AuthResult;
import com.capitalfourge.portfoliomanager.application.ports.dto.auth.LoginCommand;
import com.capitalfourge.portfoliomanager.application.ports.in.PortfolioUseCase;
import com.capitalfourge.portfoliomanager.application.ports.in.UserUseCase;
import com.capitalfourge.portfoliomanager.application.ports.out.UserRepository;
import com.capitalfourge.portfoliomanager.domain.Asset;
import com.capitalfourge.portfoliomanager.domain.Feedback;
import com.capitalfourge.portfoliomanager.domain.Portfolio;
import com.capitalfourge.portfoliomanager.domain.Position;
import com.capitalfourge.portfoliomanager.domain.Role;
import com.capitalfourge.portfoliomanager.domain.Transaction;
import com.capitalfourge.portfoliomanager.domain.User;
import com.capitalfourge.portfoliomanager.infrastructure.adapters.out.datacollector.DataCollectorClient;
import com.capitalfourge.portfoliomanager.infrastructure.adapters.out.datacollector.DataCollectorClient.AssetDTO;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class PortfolioGraphQLController {

    private final UserUseCase userUseCase;
    private final PortfolioUseCase portfolioUseCase;
    private final UserRepository userRepository;
    private final DataCollectorClient dataCollectorClient;

    // Queries
    @QueryMapping
    public User me() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return null;
        }
        UUID userId = getUserIdFromAuth(auth);
        User user = userUseCase.findById(userId).orElse(null);
        if (user != null) {
            // Ensure balances are never null
            if (user.getCashBalance() == null) user.setCashBalance(BigDecimal.ZERO);
            if (user.getLockedBalance() == null) user.setLockedBalance(BigDecimal.ZERO);
        }
        return user;
    }

    @QueryMapping
    public List<Portfolio> portfolios() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return List.of();
        }
        UUID userId = getUserIdFromAuth(auth);
        return portfolioUseCase.getPortfoliosByUser(userId);
    }

    @QueryMapping
    public Portfolio portfolio(@Argument UUID id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return null;
        }
        UUID userId = getUserIdFromAuth(auth);
        return portfolioUseCase.getPortfolio(id);
    }

    @QueryMapping
    public List<AssetMover> assetMovers(@Argument String sort, @Argument Integer limit) {
        return List.of(); // Not implemented via REST yet
    }

    @QueryMapping
    public List<Asset> assetsByCategory(@Argument String category) {
        return dataCollectorClient.getAssetsByCategory(category).stream()
                .map(dto -> Asset.builder()
                        .symbol(dto.symbol())
                        .name(dto.name())
                        .category(dto.category())
                        .build())
                .toList();
    }

    @QueryMapping
    public List<Asset> searchSymbols(@Argument String query, @Argument Integer limit) {
        return dataCollectorClient.searchSymbols(query, limit != null ? limit : 20).stream()
                .map(dto -> Asset.builder()
                        .symbol(dto.symbol())
                        .name(dto.name())
                        .category(dto.category())
                        .build())
                .toList();
    }

    @QueryMapping
    public List<Feedback> myFeedbacks() {
        // Return empty list for now - in production this would come from a feedback service
        return List.of();
    }

    // Type resolvers
    @SchemaMapping(typeName = "Portfolio")
    public List<Position> positions(Portfolio portfolio) {
        return portfolio.getPositions();
    }

    @SchemaMapping(typeName = "Portfolio")
    public Float performance(Portfolio portfolio) {
        Double perf = portfolio.getPerformance();
        return perf != null ? perf.floatValue() : 0.0f;
    }

    @SchemaMapping(typeName = "Portfolio")
    public Boolean isPublic(Portfolio portfolio) {
        return portfolio.isPublic();
    }

    @SchemaMapping(typeName = "Portfolio")
    public String shareSlug(Portfolio portfolio) {
        return portfolio.getShareSlug();
    }

    @SchemaMapping(typeName = "Portfolio")
    public List<Transaction> transactions(Portfolio portfolio) {
        return portfolio.getTransactions();
    }

    @SchemaMapping(typeName = "Transaction")
    public String type(Transaction transaction) {
        return transaction.getType() != null ? transaction.getType().name() : "UNKNOWN";
    }

    @SchemaMapping(typeName = "Transaction")
    public String timestamp(Transaction transaction) {
        return transaction.getTimestamp() != null ? transaction.getTimestamp().toString() : "";
    }

    @SchemaMapping(typeName = "Transaction")
    public Float totalAmount(Transaction transaction) {
        BigDecimal amount = transaction.getTotalAmount();
        return amount != null ? amount.floatValue() : 0.0f;
    }

    @SchemaMapping(typeName = "Transaction")
    public Float quantity(Transaction transaction) {
        return transaction.getQuantity() != null ? transaction.getQuantity().floatValue() : 0.0f;
    }

    @SchemaMapping(typeName = "Transaction")
    public Float price(Transaction transaction) {
        return transaction.getPrice() != null ? transaction.getPrice().floatValue() : 0.0f;
    }

    @SchemaMapping(typeName = "Transaction")
    public String symbol(Transaction transaction) {
        return transaction.getSymbol();
    }

    @SchemaMapping(typeName = "Transaction")
    public Float balanceTransaction(Transaction transaction) {
        return transaction.getBalanceTransaction() != null ? transaction.getBalanceTransaction().floatValue() : 0.0f;
    }

    @SchemaMapping(typeName = "User")
    public String email(User user) {
        return user.getEmail();
    }

    @SchemaMapping(typeName = "User")
    public String language(User user) {
        return user.getLanguage() != null ? user.getLanguage() : "ES";
    }

    @SchemaMapping(typeName = "User")
    public String id(User user) {
        return user.getId() != null ? user.getId().toString() : "";
    }

    @SchemaMapping(typeName = "Feedback")
    public String userId(Feedback feedback) {
        return feedback.getUserId() != null ? feedback.getUserId().toString() : "";
    }

    @SchemaMapping(typeName = "Feedback")
    public String category(Feedback feedback) {
        return feedback.getCategory() != null ? feedback.getCategory().name() : "OTRO";
    }

    @SchemaMapping(typeName = "Feedback")
    public String createdAt(Feedback feedback) {
        return feedback.getCreatedAt() != null ? feedback.getCreatedAt().toString() : "";
    }

    @SchemaMapping(typeName = "Position")
    public Float currentPrice(Position position) {
        BigDecimal price = position.getCurrentPrice();
        return price != null ? price.floatValue() : position.getAveragePurchasePrice().floatValue();
    }

    @SchemaMapping(typeName = "Position")
    public Float quantity(Position position) {
        return position.getQuantity().floatValue();
    }

    @SchemaMapping(typeName = "Position")
    public Float averagePurchasePrice(Position position) {
        return position.getAveragePurchasePrice().floatValue();
    }

    // Mutations
    @MutationMapping
    public AuthResult login(@Argument String email, @Argument String password) {
        return userUseCase.login(new LoginCommand(email, password));
    }

    @MutationMapping
    @PreAuthorize("hasRole('USER')")
    public Portfolio createPortfolio(@Argument("name") String name, @Argument("description") String description) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UUID userId = getUserIdFromAuth(auth);
        return portfolioUseCase.createPortfolio(Portfolio.builder()
                .name(name)
                .description(description)
                .userId(userId)
                .build());
    }

    @MutationMapping
    @PreAuthorize("hasRole('USER')")
    public Portfolio buyAsset(@Argument("portfolioId") UUID portfolioId, @Argument("symbol") String symbol,
            @Argument("quantity") BigDecimal quantity, @Argument("price") BigDecimal price) {
        verifyPortfolioOwnership(portfolioId);
        return portfolioUseCase.buyAsset(portfolioId, symbol, quantity, price);
    }

    @MutationMapping
    @PreAuthorize("hasRole('USER')")
    public Portfolio sellAsset(@Argument("portfolioId") UUID portfolioId, @Argument("symbol") String symbol,
            @Argument("quantity") BigDecimal quantity, @Argument("price") BigDecimal price) {
        verifyPortfolioOwnership(portfolioId);
        return portfolioUseCase.sellAsset(portfolioId, symbol, quantity, price);
    }

    @MutationMapping
    @PreAuthorize("hasRole('USER')")
    public Portfolio buyAssetByUSD(@Argument("portfolioId") UUID portfolioId, @Argument("symbol") String symbol,
            @Argument("usdAmount") BigDecimal usdAmount, @Argument("price") BigDecimal price) {
        verifyPortfolioOwnership(portfolioId);
        return portfolioUseCase.buyAssetByUSD(portfolioId, symbol, usdAmount, price);
    }

    @MutationMapping
    @PreAuthorize("hasRole('USER')")
    public Portfolio sellAssetByUSD(@Argument("portfolioId") UUID portfolioId, @Argument("symbol") String symbol,
            @Argument("usdAmount") BigDecimal usdAmount, @Argument("price") BigDecimal price) {
        verifyPortfolioOwnership(portfolioId);
        return portfolioUseCase.sellAssetByUSD(portfolioId, symbol, usdAmount, price);
    }

    @MutationMapping
    @PreAuthorize("hasRole('USER')")
    public Portfolio addCash(@Argument("portfolioId") UUID portfolioId, @Argument("amount") BigDecimal amount) {
        verifyPortfolioOwnership(portfolioId);
        return portfolioUseCase.addCash(portfolioId, amount);
    }

    @MutationMapping
    @PreAuthorize("hasRole('USER')")
    public Portfolio withdrawCash(@Argument("portfolioId") UUID portfolioId, @Argument("amount") BigDecimal amount) {
        verifyPortfolioOwnership(portfolioId);
        return portfolioUseCase.withdrawCash(portfolioId, amount);
    }

    @MutationMapping
    @PreAuthorize("hasRole('USER')")
    public User deposit(@Argument("amount") BigDecimal amount) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UUID userId = getUserIdFromAuth(auth);
        return userUseCase.deposit(userId, amount);
    }

    @MutationMapping
    @PreAuthorize("hasRole('USER')")
    public User withdraw(@Argument("amount") BigDecimal amount) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UUID userId = getUserIdFromAuth(auth);
        return userUseCase.withdraw(userId, amount);
    }

    @MutationMapping
    @PreAuthorize("hasRole('USER')")
    public Boolean deletePortfolio(@Argument("id") UUID id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UUID userId = getUserIdFromAuth(auth);
        Portfolio portfolio = portfolioUseCase.getPortfolio(id);
        if (!portfolio.getUserId().equals(userId)) {
            throw new RuntimeException("Portfolio not found or access denied");
        }
        portfolioUseCase.deletePortfolio(id);
        return true;
    }

    @MutationMapping
    @PreAuthorize("hasRole('USER')")
    public Portfolio toggleVisibility(@Argument UUID portfolioId, @Argument boolean isPublic) {
        verifyPortfolioOwnership(portfolioId);
        return portfolioUseCase.toggleVisibility(portfolioId, isPublic);
    }

    @MutationMapping
    @PreAuthorize("hasRole('ADMIN')")
    public User adminSetRole(@Argument UUID userId, @Argument String role) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UUID currentUserId = getUserIdFromAuth(auth);
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
    @PreAuthorize("hasRole('ADMIN')")
    public Boolean adminDeactivateUser(@Argument UUID userId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UUID currentUserId = getUserIdFromAuth(auth);
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (!currentUser.isAdmin()) {
            throw new RuntimeException("Admin access required");
        }
        userUseCase.adminDeactivateUser(userId);
        return true;
    }

    @MutationMapping
    @PreAuthorize("hasRole('USER')")
    public Boolean repairBalance() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UUID userId = getUserIdFromAuth(auth);
        portfolioUseCase.repairUserBalance(userId);
        return true;
    }

    @GraphQlExceptionHandler
    public GraphQLError handle(RuntimeException ex, DataFetchingEnvironment env) {
        return GraphQLError.newError()
                .errorType(graphql.ErrorType.ValidationError)
                .message(ex.getMessage())
                .path(env.getExecutionStepInfo().getPath())
                .location(env.getField().getSourceLocation())
                .build();
    }

    private UUID getUserIdFromAuth(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new RuntimeException("Authentication required");
        }
        Object principal = auth.getPrincipal();
        if (principal instanceof UUID) {
            return (UUID) principal;
        }
        // Fallback for string representation
        return UUID.fromString(principal.toString());
    }

    private void verifyPortfolioOwnership(UUID portfolioId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UUID userId = getUserIdFromAuth(auth);
        Portfolio portfolio = portfolioUseCase.getPortfolio(portfolioId);
        if (!portfolio.getUserId().equals(userId)) {
            throw new RuntimeException("Portfolio not found or access denied");
        }
    }

    // DTOs for GraphQL
    public record AssetMover(
        String symbol,
        String name,
        Float price,
        Float changePercent,
        Float changeValue,
        Float volume
    ) {}
}