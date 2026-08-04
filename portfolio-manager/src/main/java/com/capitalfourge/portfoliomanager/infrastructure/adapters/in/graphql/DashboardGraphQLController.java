package com.capitalfourge.portfoliomanager.infrastructure.adapters.in.graphql;

import com.capitalfourge.portfoliomanager.application.ports.in.PortfolioUseCase;
import com.capitalfourge.portfoliomanager.application.ports.in.UserUseCase;
import com.capitalfourge.portfoliomanager.application.services.PortfolioService;
import com.capitalfourge.portfoliomanager.domain.Portfolio;
import com.capitalfourge.portfoliomanager.domain.Position;
import com.capitalfourge.portfoliomanager.domain.User;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.graphql.data.method.annotation.SchemaMapping;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Controller
public class DashboardGraphQLController {

    private final PortfolioUseCase portfolioUseCase;
    private final UserUseCase userUseCase;
    private final PortfolioService portfolioService;

    public DashboardGraphQLController(PortfolioUseCase portfolioUseCase, UserUseCase userUseCase, PortfolioService portfolioService) {
        this.portfolioUseCase = portfolioUseCase;
        this.userUseCase = userUseCase;
        this.portfolioService = portfolioService;
    }

    @QueryMapping
    public User me() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return null;
        }
        String email = auth.getName();
        return userUseCase.findByEmail(email).orElse(null);
    }

    @QueryMapping
    public List<Portfolio> portfolios() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return List.of();
        }
        String email = auth.getName();
        return userUseCase.findByEmail(email)
                .map(user -> portfolioUseCase.getPortfoliosByUser(user.getId()))
                .orElse(List.of());
    }

    @QueryMapping
    public List<AssetMover> assetMovers(String sort, Integer limit) {
        // Return empty for now - asset movers not implemented via REST yet
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