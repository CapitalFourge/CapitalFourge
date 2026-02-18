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

    public List<String> getAllAvailableSymbols() {
        try {
            EmptyRequest request = EmptyRequest.newBuilder().build();
            SymbolsResponse response = financialDataClient.getAvailableSymbols(request);
            return response.getSymbolsList();
        } catch (Exception e) {
            System.err.println("gRPC Get Symbols Error: " + e.getMessage());
            // Fallback to static list if gRPC call fails
            return List.of(
                    // Stocks
                    "AAPL", "GOOGL", "MSFT", "AMZN", "TSLA", "META", "NVDA", "JPM", "V", "WMT",
                    "DIS", "NFLX", "INTC", "AMD", "PYPL", "ADBE", "CRM", "ORCL", "IBM",
                    "BA", "GS", "HD", "LOW", "NKE", "PFE", "T", "VZ", "WFC",
                    // Crypto (simple format)
                    "BTC", "ETH", "SOL", "ADA", "DOT", "XRP", "DOGE", "SHIB", "MATIC", "AVAX",
                    "LINK", "UNI", "AAVE",
                    // Crypto (USD format for Yahoo Finance)
                    "BTC-USD", "ETH-USD", "SOL-USD", "ADA-USD", "DOT-USD", "XRP-USD",
                    "DOGE-USD", "SHIB-USD", "MATIC-USD", "AVAX-USD", "LINK-USD", "UNI-USD", "AAVE-USD"
            );
        }
    }

    public String getAssetName(String symbol) {
        // Por ahora, devolver el símbolo mismo
        // En el futuro, esto debería consultar al data-collector
        return symbol;
    }
}
