package com.capitalfourge.portfoliomanager.infrastructure.adapters.in.graphql;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.graphql.data.method.annotation.SchemaMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;

import com.capitalfourge.portfoliomanager.domain.Asset;
import com.capitalfourge.portfoliomanager.domain.CryptoPricePoint;
import com.capitalfourge.portfoliomanager.domain.CommodityPricePoint;
import com.capitalfourge.portfoliomanager.domain.Feedback;
import com.capitalfourge.portfoliomanager.domain.ForexPricePoint;
import com.capitalfourge.portfoliomanager.domain.Portfolio;
import com.capitalfourge.portfoliomanager.domain.Position;
import com.capitalfourge.portfoliomanager.domain.Role;
import com.capitalfourge.portfoliomanager.domain.StockPricePoint;
import com.capitalfourge.portfoliomanager.domain.Transaction;
import com.capitalfourge.portfoliomanager.domain.TransactionType;
import com.capitalfourge.portfoliomanager.domain.User;
import com.capitalfourge.portfoliomanager.infrastructure.adapters.out.datacollector.DataCollectorClient;
import com.capitalfourge.portfoliomanager.infrastructure.security.UserPrincipal;
import com.capitalfourge.portfoliomanager.application.ports.dto.auth.AuthResult;
import com.capitalfourge.portfoliomanager.application.ports.dto.auth.ChangePasswordCommand;
import com.capitalfourge.portfoliomanager.application.ports.dto.auth.LoginCommand;
import com.capitalfourge.portfoliomanager.application.ports.in.PortfolioUseCase;
import com.capitalfourge.portfoliomanager.application.ports.in.UserUseCase;
import com.capitalfourge.portfoliomanager.application.ports.out.UserRepository;
import graphql.GraphQLError;
import graphql.schema.DataFetchingEnvironment;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class PortfolioGraphQLController {

    private final UserUseCase userUseCase;
    private final PortfolioUseCase portfolioUseCase;
    private final UserRepository userRepository;
    private final DataCollectorClient dataCollectorClient;

    // Helper to determine asset type from symbol
    private String getAssetType(String symbol) {
        if (symbol.endsWith("-USD")) return "CRYPTO";
        if (symbol.endsWith("=F") || symbol.matches("^(GC|SI|CL|NG|HG|BZ|PL|PA)$")) return "COMMODITIES";
        if (symbol.endsWith("=X")) return "FOREX";
        return "STOCKS";
    }

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
    public AssetMovers assetMovers(@Argument String sort, @Argument Integer limit) {
        int effectiveLimit = limit != null ? limit : 8;
        DataCollectorClient.AssetMoversDTO dto = dataCollectorClient.getAssetMovers("STOCKS", sort != null ? sort : "volatile", effectiveLimit);
        List<AssetMover> gainers = dto.topGainers() != null ? dto.topGainers().stream().map(this::toAssetMover).collect(Collectors.toList()) : List.of();
        List<AssetMover> losers = dto.topLosers() != null ? dto.topLosers().stream().map(this::toAssetMover).collect(Collectors.toList()) : List.of();
        List<AssetMover> traded = dto.mostTraded() != null ? dto.mostTraded().stream().map(this::toAssetMover).collect(Collectors.toList()) : List.of();
        
        return new AssetMovers(gainers, losers, traded);
    }
    
    private <T> java.util.function.Predicate<T> distinctByKey(java.util.function.Function<? super T, ?> keyExtractor) {
        Set<Object> seen = java.util.concurrent.ConcurrentHashMap.newKeySet();
        return t -> seen.add(keyExtractor.apply(t));
    }
    
    private AssetMover toAssetMover(DataCollectorClient.AssetMoverDTO dto) {
        return new AssetMover(
            dto.symbol(),
            dto.name(),
            dto.price(),
            dto.changePercent(),
            dto.changeValue(),
            dto.volume(),
            dto.changePercent24h(),
            dto.changePercent24h(), // change24h alias for changePercent24h
            dto.volume24h()
        );
    }

    @QueryMapping
    public List<Asset> assets() {
        List<DataCollectorClient.AssetDTO> dtos = dataCollectorClient.getAssetsByCategory("STOCKS");
        if (dtos == null) return List.of();
        return dtos.stream()
            .map(this::toAsset)
            .collect(Collectors.toList());
    }
    
    @QueryMapping
    public List<String> assetCategories() {
        return List.of("STOCKS", "CRYPTO", "COMMODITIES", "FOREX", "ETF");
    }
    
    @QueryMapping
    public List<Asset> assetsByCategory(@Argument String category) {
        List<DataCollectorClient.AssetDTO> dtos = dataCollectorClient.getAssetsByCategory(category);
        if (dtos == null) return List.of();
        return dtos.stream()
            .map(this::toAsset)
            .collect(Collectors.toList());
    }
    
    private Asset toAsset(DataCollectorClient.AssetDTO dto) {
        return Asset.builder()
                .symbol(dto.symbol())
                .name(dto.name())
                .category(dto.category())
                .description(dto.description())
                .website(dto.website())
                .logo(dto.logo())
                .sector(dto.sector())
                .industry(dto.industry())
                .build();
    }

    @QueryMapping
    public List<Asset> searchSymbols(@Argument String query, @Argument Integer limit) {
        return dataCollectorClient.searchSymbols(query, limit != null ? limit : 20).stream()
                .map(this::toAsset)
                .collect(Collectors.toList());
    }

    @QueryMapping
    public List<Feedback> myFeedbacks() {
        return List.of();
    }

    @QueryMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<User> adminUsers() {
        return userUseCase.adminGetAllUsers();
    }

    @QueryMapping
    public Asset asset(@Argument String symbol) {
        DataCollectorClient.AssetDTO dto = dataCollectorClient.getAsset(symbol);
        if (dto == null) {
            return null;
        }
        return toAsset(dto);
    }

    @QueryMapping
    public List<Object> priceHistory(@Argument String symbol, @Argument String range, @Argument Integer days) {
        String effectiveRange = range != null ? range : "1m";
        if (days != null) {
            effectiveRange = days + "d";
        }
        String assetType = getAssetType(symbol);
        
        return dataCollectorClient.getPriceHistory(symbol, effectiveRange).stream()
                .map(dto -> {
                    switch (assetType) {
                        case "CRYPTO":
                            return CryptoPricePoint.builder()
                                    .timestamp(dto.timestamp())
                                    .open(dto.open())
                                    .high(dto.high())
                                    .low(dto.low())
                                    .close(dto.close())
                                    .volume(dto.volume())
                                    .date(dto.timestamp())
                                    .marketCap(dto.marketCap())
                                    .build();
                        case "COMMODITIES":
                            return CommodityPricePoint.builder()
                                    .timestamp(dto.timestamp())
                                    .open(dto.open())
                                    .high(dto.high())
                                    .low(dto.low())
                                    .close(dto.close())
                                    .volume(dto.volume())
                                    .date(dto.timestamp())
                                    .marketCap(dto.marketCap())
                                    .build();
                        case "FOREX":
                            return ForexPricePoint.builder()
                                    .timestamp(dto.timestamp())
                                    .open(dto.open())
                                    .high(dto.high())
                                    .low(dto.low())
                                    .close(dto.close())
                                    .volume(dto.volume())
                                    .date(dto.timestamp())
                                    .marketCap(dto.marketCap())
                                    .build();
                        default: // STOCKS
                            return StockPricePoint.builder()
                                    .timestamp(dto.timestamp())
                                    .open(dto.open())
                                    .high(dto.high())
                                    .low(dto.low())
                                    .close(dto.close())
                                    .volume(dto.volume())
                                    .date(dto.timestamp())
                                    .marketCap(dto.marketCap())
                                    .trailingPe(dto.trailingPe())
                                    .forwardPe(dto.forwardPe())
                                    .pegRatio(dto.pegRatio())
                                    .priceToBook(dto.priceToBook())
                                    .priceToSales(dto.priceToSales())
                                    .enterpriseToEbitda(dto.enterpriseToEbitda())
                                    .profitMargins(dto.profitMargins())
                                    .operatingMargins(dto.operatingMargins())
                                    .returnOnEquity(dto.returnOnEquity())
                                    .returnOnAssets(dto.returnOnAssets())
                                    .debtToEquity(dto.debtToEquity())
                                    .currentRatio(dto.currentRatio())
                                    .quickRatio(dto.quickRatio())
                                    .dividendYield(dto.dividendYield())
                                    .freeCashFlow(dto.freeCashFlow())
                                    .build();
                    }
                })
                .collect(Collectors.toList());
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

    @SchemaMapping(typeName = "User")
    public String role(User user) {
        return user.getRole() != null ? user.getRole().name() : "USER";
    }

    @SchemaMapping(typeName = "User")
    public Boolean active(User user) {
        return user.isActive();
    }

    @SchemaMapping(typeName = "User")
    public String createdAt(User user) {
        return user.getCreatedAt() != null ? user.getCreatedAt().toString() : "";
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
        userUseCase.deposit(userId, amount);
        return userUseCase.findById(userId).orElse(null);
    }

    @MutationMapping
    @PreAuthorize("hasRole('USER')")
    public User withdraw(@Argument("amount") BigDecimal amount) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UUID userId = getUserIdFromAuth(auth);
        userUseCase.withdraw(userId, amount);
        return userUseCase.findById(userId).orElse(null);
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
        userUseCase.adminSetRole(userId, Role.valueOf(role.toUpperCase()));
        return userUseCase.findById(userId).orElse(null);
    }

    @MutationMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Boolean adminDeactivateUser(@Argument UUID userId) {
        userUseCase.adminDeactivateUser(userId);
        return true;
    }

    @MutationMapping
    @PreAuthorize("hasRole('USER')")
    public User updateProfile(@Argument String username, @Argument String email, @Argument String language) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UUID userId = getUserIdFromAuth(auth);
        return userUseCase.updateProfile(userId, username, email, language);
    }

    @MutationMapping
    @PreAuthorize("hasRole('USER')")
    public Boolean changePassword(@Argument String currentPassword, @Argument String newPassword) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UUID userId = getUserIdFromAuth(auth);
        userUseCase.changePassword(new ChangePasswordCommand(userId, currentPassword, newPassword));
        return true;
    }

    @MutationMapping
    @PreAuthorize("hasRole('USER')")
    public Boolean repairMyBalance() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UUID userId = getUserIdFromAuth(auth);
        // userUseCase.repairBalance(userId);  // TODO: add this method to UserUseCase
        return true;
    }

    @MutationMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Boolean repairBalance(@Argument UUID userId) {
        // userUseCase.repairBalance(userId);  // TODO: add this method to UserUseCase
        return true;
    }

    private UUID getUserIdFromAuth(Authentication auth) {
        if (auth.getPrincipal() instanceof UserPrincipal) {
            return ((UserPrincipal) auth.getPrincipal()).userId();
        }
        throw new IllegalStateException("Invalid authentication principal");
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
        Float volume,
        Float changePercent24h,
        Float change24h,
        Float volume24h
    ) {}

    public record AssetMovers(
        List<AssetMover> topGainers,
        List<AssetMover> topLosers,
        List<AssetMover> mostTraded
    ) {}
}