package com.finsight.portfoliomanager.infrastructure.grpc;

import java.util.Map;
import java.util.List;

import org.springframework.stereotype.Service;

import com.finsight.proto.*;

import net.devh.boot.grpc.client.inject.GrpcClient;

@Service
public class GrpcFinancialDataClient {

    @GrpcClient("local-grpc-server")
    private FinancialDataServiceGrpc.FinancialDataServiceBlockingStub financialDataClient;

    public Double getStockPrice(String symbol) {
        try {
            StockRequest request = StockRequest.newBuilder()
                    .setSymbol(symbol)
                    .build();

            StockPriceResponse response = financialDataClient.getStockPrice(request);

            System.out.println("✅ gRPC Response: " + response.getSymbol() + " = " + response.getPrice());
            return response.getPrice();
        } catch (Exception e) {
            System.err.println("❌ gRPC Error: " + e.getMessage());
            return 0.0;
        }
    }

    public Map<String, Double> getBatchPrices(List<String> symbols) {
        try {
            BatchStockRequest request = BatchStockRequest.newBuilder()
                    .addAllSymbols(symbols)
                    .build();

            BatchStockResponse response = financialDataClient.getBatchPrices(request);

            return response.getPricesMap();
        } catch (Exception e) {
            System.err.println("gRPC Batch Error: " + e.getMessage());
            return Map.of();
        }
    }

    public List<PricePoint> getPriceHistory(String symbol, int days) {
        try {
            HistoryRequest request = HistoryRequest.newBuilder()
                    .setSymbol(symbol)
                    .setDays(days)
                    .build();

            HistoryResponse response = financialDataClient.getPriceHistory(request);

            return response.getHistoryList();
        } catch (Exception e) {
            System.err.println("gRPC History Error: " + e.getMessage());
            return List.of();
        }
    }

    public List<Asset> getCategorizedAssets() {
        try {
            EmptyRequest request = EmptyRequest.newBuilder().build();
            CategorizedAssetsResponse response = financialDataClient.getCategorizedAssets(request);
            return response.getAssetsList();
        } catch (Exception e) {
            System.err.println("gRPC Get Categorized Assets Error: " + e.getMessage());
            // Fallback to minimal list if gRPC call fails
            return List.of();
        }
    }

    public List<String> getAllAvailableSymbols() {
        try {
            EmptyRequest request = EmptyRequest.newBuilder().build();
            SymbolsResponse response = financialDataClient.getAvailableSymbols(request);
            return response.getSymbolsList();
        } catch (Exception e) {
            System.err.println("gRPC Get Symbols Error: " + e.getMessage());
            // Fallback to static list if gRPC call fails
            return List.of(
                    "AAPL", "GOOGL", "MSFT", "AMZN", "TSLA", "META", "NVDA", "NFLX", "AMD",
                    "BTC-USD", "ETH-USD", "SOL-USD", "ADA-USD", "DOT-USD", "XRP-USD",
                    "XAUUSD=C", "XAGUSD=C", "CL=F", "NG=F", "EURUSD=X", "GBPUSD=X");
        }
    }

    public String getAssetName(String symbol) {
        // Find in categorized assets if available
        return getCategorizedAssets().stream()
                .filter(a -> a.getSymbol().equals(symbol))
                .map(Asset::getName)
                .findFirst()
                .orElse(symbol);
    }
}
