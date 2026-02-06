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
}
