package com.capitalfourge.portfoliomanager.infrastructure.adapters.in.rest;

import java.math.BigDecimal;
import java.util.UUID;
import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.capitalfourge.portfoliomanager.application.ports.in.PortfolioUseCase;
import com.capitalfourge.portfoliomanager.domain.Portfolio;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/portfolios")
@RequiredArgsConstructor
public class PortfolioController {
    private final PortfolioUseCase portfolioUseCase;

    @PostMapping
    public Portfolio create(@RequestBody Portfolio portfolio) {
        return portfolioUseCase.createPortfolio(portfolio);
    }

    @GetMapping("/{id}")
    public Portfolio get(@PathVariable UUID id) {
        return portfolioUseCase.getPortfolio(id);
    }

    @GetMapping("/user/{userId}")
    public List<Portfolio> getByUserId(@PathVariable UUID userId) {
        return portfolioUseCase.getPortfoliosByUser(userId);
    }

    @PostMapping("/{id}/cash/deposit")
    public Portfolio deposit(@PathVariable UUID id, @RequestParam BigDecimal amount) {
        return portfolioUseCase.addCash(id, amount);
    }

    @PostMapping("/{id}/cash/withdraw")
    public Portfolio withdraw(@PathVariable UUID id, @RequestParam BigDecimal amount) {
        return portfolioUseCase.withdrawCash(id, amount);
    }

    @PostMapping("/{id}/trade/buy")
    public Portfolio buy(@PathVariable UUID id,
            @RequestParam String symbol,
            @RequestParam BigDecimal quantity,
            @RequestParam BigDecimal price) {
        return portfolioUseCase.buyAsset(id, symbol, quantity, price);
    }

    @PostMapping("/{id}/trade/sell")
    public Portfolio sell(@PathVariable UUID id,
            @RequestParam String symbol,
            @RequestParam BigDecimal quantity,
            @RequestParam BigDecimal price) {
        return portfolioUseCase.sellAsset(id, symbol, quantity, price);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        portfolioUseCase.deletePortfolio(id);
    }
}
