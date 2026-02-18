package com.finsight.portfoliomanager.application.services;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.finsight.portfoliomanager.application.ports.in.PortfolioUseCase;
import com.finsight.portfoliomanager.application.ports.out.MetricRepository;
import com.finsight.portfoliomanager.application.ports.out.PortfolioRepository;
import com.finsight.portfoliomanager.application.ports.out.TransactionRepository;
import com.finsight.portfoliomanager.application.ports.out.UserRepository;
import com.finsight.portfoliomanager.domain.Portfolio;
import com.finsight.portfoliomanager.domain.Position;
import com.finsight.portfoliomanager.domain.Transaction;
import com.finsight.portfoliomanager.domain.TransactionType;
import com.finsight.portfoliomanager.domain.User;
import com.finsight.portfoliomanager.infrastructure.grpc.GrpcFinancialDataClient;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PortfolioService implements PortfolioUseCase {

    private final PortfolioRepository portfolioRepository;
    private final MetricRepository metricRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final GrpcFinancialDataClient grpcFinancialDataClient;

    @Override
    public Portfolio createPortfolio(Portfolio portfolio) {
        if (portfolio.getId() == null) {
            portfolio.setId(UUID.randomUUID());
        }
        if (portfolio.getPositions() == null) {
            portfolio.setPositions(new ArrayList<>());
        }
        if (portfolio.getTransactions() == null) {
            portfolio.setTransactions(new ArrayList<>());
        }

        portfolio.setCumulativeDeposits(BigDecimal.ZERO);
        portfolio.setCumulativeWithdrawals(BigDecimal.ZERO);
        portfolio.setPerformance(0.0);

        if (portfolio.getUserId() != null) {
            metricRepository.recordUserActivity(portfolio.getUserId().toString());
        }

        metricRepository.incrementPortfolioCount();

        return portfolioRepository.save(portfolio);
    }

    @Override
    public Portfolio getPortfolio(UUID id) {
        Portfolio portfolio = portfolioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Portfolio not found"));
        metricRepository.recordUserActivity(portfolio.getUserId().toString());

        // Update current prices for all positions
        if (portfolio.getPositions() != null && !portfolio.getPositions().isEmpty()) {
            List<String> symbols = portfolio.getPositions().stream()
                    .map(Position::getSymbol)
                    .distinct()
                    .toList();

            if (!symbols.isEmpty()) {
                Map<String, Double> currentPrices = grpcFinancialDataClient.getBatchPrices(symbols);

                portfolio.getPositions().forEach(position -> {
                    Double price = currentPrices.get(position.getSymbol());
                    if (price != null) {
                        position.setCurrentPrice(BigDecimal.valueOf(price));
                    }
                });
            }
        }

        return portfolio;
    }

    @Override
    public Portfolio buyAsset(UUID portfolioId, String symbol, BigDecimal quantity, BigDecimal price) {
        Portfolio portfolio = getPortfolio(portfolioId);
        BigDecimal totalCost = price.multiply(quantity);

        // Get user and check global cash balance
        User user = userRepository.findById(portfolio.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        BigDecimal userCashBalance = user.getCashBalance() != null ? user.getCashBalance() : BigDecimal.ZERO;

        if (userCashBalance.compareTo(totalCost) < 0) {
            throw new RuntimeException("Insufficient balance for trade");
        }

        // Deduct from user's global cash balance
        user.setCashBalance(userCashBalance.subtract(totalCost));
        userRepository.save(user);

        // Update portfolio positions
        Optional<Position> existing = portfolio.getPositions()
                .stream().filter(p -> p.getSymbol().equals(symbol)).findFirst();
        if (existing.isPresent()) {
            Position pos = existing.get();
            BigDecimal newQty = pos.getQuantity().add(quantity);
            BigDecimal totalSpent = pos.getQuantity()
                    .multiply(pos.getAveragePurchasePrice()).add(totalCost);
            pos.setAveragePurchasePrice(totalSpent.divide(newQty, 4, RoundingMode.HALF_UP));
            pos.setQuantity(newQty);
        } else {
            portfolio.getPositions().add(Position.builder()
                    .id(UUID.randomUUID())
                    .portfolioId(portfolioId)
                    .symbol(symbol)
                    .quantity(quantity)
                    .averagePurchasePrice(price)
                    .currentPrice(price)
                    .build());
        }

        Transaction transaction = Transaction.builder()
                .id(UUID.randomUUID()).portfolioId(portfolioId).type(TransactionType.BUY)
                .symbol(symbol).quantity(quantity).price(price)
                .totalAmount(totalCost).timestamp(LocalDateTime.now())
                .balanceTransaction(user.getCashBalance()).build();

        transactionRepository.save(transaction);
        portfolio.getTransactions().add(transaction);

        metricRepository.incrementAssetVolume(symbol, quantity.doubleValue());
        updatePerformance(portfolio);

        return portfolioRepository.save(portfolio);
    }

    @Override
    public Portfolio sellAsset(UUID portfolioId, String symbol, BigDecimal quantity, BigDecimal price) {
        Portfolio portfolio = getPortfolio(portfolioId);
        Position pos = portfolio.getPositions().stream()
                .filter(p -> p.getSymbol().equals(symbol)).findFirst()
                .orElseThrow(() -> new RuntimeException("Symbol not found in portfolio"));
        if (pos.getQuantity().compareTo(quantity) < 0) {
            throw new RuntimeException("Not enough assets to sell");
        }
        BigDecimal totalAmount = price.multiply(quantity);

        // Get user and add to global cash balance
        User user = userRepository.findById(portfolio.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        BigDecimal userCashBalance = user.getCashBalance() != null ? user.getCashBalance() : BigDecimal.ZERO;
        user.setCashBalance(userCashBalance.add(totalAmount));
        userRepository.save(user);

        // Update portfolio positions
        pos.setQuantity(pos.getQuantity().subtract(quantity));
        if (pos.getQuantity().compareTo(BigDecimal.ZERO) == 0) {
            portfolio.getPositions().remove(pos);
        }

        Transaction transaction = Transaction.builder()
                .id(UUID.randomUUID()).portfolioId(portfolioId).type(TransactionType.SELL)
                .symbol(symbol).quantity(quantity).price(price)
                .totalAmount(totalAmount).timestamp(LocalDateTime.now())
                .balanceTransaction(user.getCashBalance()).build();

        transactionRepository.save(transaction);
        portfolio.getTransactions().add(transaction);

        metricRepository.incrementAssetVolume(symbol, quantity.doubleValue());
        updatePerformance(portfolio);

        return portfolioRepository.save(portfolio);
    }

    @Override
    public Portfolio addCash(UUID portfolioId, BigDecimal amount) {
        Portfolio portfolio = getPortfolio(portfolioId);

        // Get user and add to global cash balance
        User user = userRepository.findById(portfolio.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        BigDecimal userCashBalance = user.getCashBalance() != null ? user.getCashBalance() : BigDecimal.ZERO;
        System.out.println("💰 [addCash] BEFORE - User ID: " + user.getId() + ", Cash Balance: " + userCashBalance);
        System.out.println("💰 [addCash] Depositing amount: " + amount);

        user.setCashBalance(userCashBalance.add(amount));
        userRepository.save(user);

        System.out.println("💰 [addCash] AFTER - User Cash Balance: " + user.getCashBalance());

        // Update portfolio cumulative deposits
        portfolio.setCumulativeDeposits(portfolio.getCumulativeDeposits().add(amount));

        Transaction transaction = Transaction.builder()
                .id(UUID.randomUUID()).portfolioId(portfolioId).type(TransactionType.DEPOSIT).symbol("USD")
                .quantity(BigDecimal.ONE).price(amount)
                .totalAmount(amount).timestamp(LocalDateTime.now())
                .balanceTransaction(user.getCashBalance()).build();

        transactionRepository.save(transaction);
        portfolio.getTransactions().add(transaction);

        updatePerformance(portfolio);
        return portfolioRepository.save(portfolio);
    }

    @Override
    public Portfolio withdrawCash(UUID portfolioId, BigDecimal amount) {
        Portfolio portfolio = getPortfolio(portfolioId);

        // Get user and check global cash balance
        User user = userRepository.findById(portfolio.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        BigDecimal userCashBalance = user.getCashBalance() != null ? user.getCashBalance() : BigDecimal.ZERO;

        if (userCashBalance.compareTo(amount) < 0) {
            throw new RuntimeException("Insufficient cash balance");
        }

        // Deduct from user's global cash balance
        user.setCashBalance(userCashBalance.subtract(amount));
        userRepository.save(user);

        // Update portfolio cumulative withdrawals
        portfolio.setCumulativeWithdrawals(portfolio.getCumulativeWithdrawals().add(amount));

        Transaction transaction = Transaction.builder()
                .id(UUID.randomUUID()).portfolioId(portfolioId).type(TransactionType.WITHDRAWAL).symbol("USD")
                .quantity(BigDecimal.ONE).price(amount)
                .totalAmount(amount).timestamp(LocalDateTime.now())
                .balanceTransaction(user.getCashBalance()).build();

        transactionRepository.save(transaction);
        portfolio.getTransactions().add(transaction);
        return portfolioRepository.save(portfolio);
    }

    @Override
    public List<Portfolio> getPortfoliosByUser(UUID userId) {
        return portfolioRepository.findByUserId(userId);
    }

    @Override
    public void deletePortfolio(UUID id) {
        portfolioRepository.deleteById(id);
    }

    public Portfolio buyAssetByUSD(UUID portfolioId, String symbol, BigDecimal usdAmount, BigDecimal price) {
        BigDecimal quantity = usdAmount.divide(price, 8, RoundingMode.DOWN);
        return buyAsset(portfolioId, symbol, quantity, price);
    }

    public Portfolio sellAssetByUSD(UUID portfolioId, String symbol, BigDecimal usdAmount, BigDecimal price) {
        BigDecimal quantity = usdAmount.divide(price, 8, RoundingMode.UP);
        return sellAsset(portfolioId, symbol, quantity, price);
    }

    private void updatePerformance(Portfolio portfolio) {
        double currentVal = portfolio.getTotalAccountValue().doubleValue();
        double totalIn = portfolio.getCumulativeDeposits().doubleValue();
        double totalOut = portfolio.getCumulativeWithdrawals().doubleValue();
        double profit = (currentVal + totalOut) - totalIn;
        double roi = (totalIn > 0) ? (profit / totalIn) * 100 : 0;

        portfolio.setPerformance(roi);
        metricRepository.updatePortfolioPerformance(portfolio.getId().toString(), roi);
    }
}
