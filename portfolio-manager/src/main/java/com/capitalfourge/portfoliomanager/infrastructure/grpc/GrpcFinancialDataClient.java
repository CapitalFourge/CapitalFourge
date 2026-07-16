package com.capitalfourge.portfoliomanager.infrastructure.grpc;

import java.util.Map;
import java.util.List;
import java.util.ArrayList;
import org.springframework.beans.factory.annotation.Value;
import com.google.protobuf.Empty;

import org.springframework.stereotype.Service;

import com.capitalfourge.proto.*;

import net.devh.boot.grpc.client.inject.GrpcClient;
import io.grpc.CallOptions;
import io.grpc.Channel;
import io.grpc.ClientCall;
import io.grpc.Metadata;
import io.grpc.MethodDescriptor;
import io.grpc.ClientInterceptors;
import io.grpc.ForwardingClientCall;

@Service
public class GrpcFinancialDataClient {

    @GrpcClient("data-collector")
    private FinancialDataServiceGrpc.FinancialDataServiceBlockingStub financialDataClient;
    @Value("${grpc.fallback-assets-enabled:true}")
    private boolean fallbackAssetsEnabled;
    @Value("${grpc.data-collector.api-key:internal-service-key}")
    private String dataCollectorApiKey;

    private FinancialDataServiceGrpc.FinancialDataServiceBlockingStub stubWithApiKey() {
        Channel channel = financialDataClient.getChannel();
        Metadata additionalHeaders = new Metadata();
        Metadata.Key<String> key = Metadata.Key.of("x-api-key", Metadata.ASCII_STRING_MARSHALLER);
        additionalHeaders.put(key, dataCollectorApiKey);
        Channel interceptedChannel = ClientInterceptors.intercept(channel, new io.grpc.ClientInterceptor() {
            @Override
            public <ReqT, RespT> ClientCall<ReqT, RespT> interceptCall(
                    MethodDescriptor<ReqT, RespT> method, CallOptions callOptions, Channel next) {
                ClientCall<ReqT, RespT> call = next.newCall(method, callOptions);
                return new ForwardingClientCall.SimpleForwardingClientCall<ReqT, RespT>(call) {
                    @Override
                    public void start(Listener<RespT> responseListener, Metadata headers) {
                        headers.merge(additionalHeaders);
                        super.start(responseListener, headers);
                    }
                };
            }
        });
        return FinancialDataServiceGrpc.newBlockingStub(interceptedChannel);
    }

    public Double getStockPrice(String symbol) {
        try {
            StockRequest request = StockRequest.newBuilder()
                    .setSymbol(symbol)
                    .build();

            StockPriceResponse response = stubWithApiKey().getStockPrice(request);

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

            BatchStockResponse response = stubWithApiKey().getBatchPrices(request);

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

            HistoryResponse response = stubWithApiKey().getPriceHistory(request);

            return response.getHistoryList();
        } catch (Exception e) {
            System.err.println("gRPC History Error: " + e.getMessage());
            return List.of();
        }
    }

    public List<Asset> getCategorizedAssets() {
        try {
            EmptyRequest request = EmptyRequest.newBuilder().build();
            CategorizedAssetsResponse response = stubWithApiKey().getCategorizedAssets(request);
            return response.getAssetsList();
        } catch (Exception e) {
            System.err.println("gRPC Get Categorized Assets Error: " + e.getMessage());
            if (fallbackAssetsEnabled) {
                // Category names MUST match the gRPC server and frontend (uppercase)
                List<Asset> fallback = new ArrayList<>();
                fallback.add(Asset.newBuilder().setSymbol("BTC-USD").setName("Bitcoin").setCategory("CRYPTO").build());
                fallback.add(Asset.newBuilder().setSymbol("ETH-USD").setName("Ethereum").setCategory("CRYPTO").build());
                fallback.add(Asset.newBuilder().setSymbol("SOL-USD").setName("Solana").setCategory("CRYPTO").build());
                fallback.add(Asset.newBuilder().setSymbol("AAPL").setName("Apple Inc.").setCategory("STOCKS").build());
                fallback.add(
                        Asset.newBuilder().setSymbol("MSFT").setName("Microsoft Corp.").setCategory("STOCKS").build());
                fallback.add(
                        Asset.newBuilder().setSymbol("NVDA").setName("NVIDIA Corp.").setCategory("STOCKS").build());
                fallback.add(Asset.newBuilder().setSymbol("GC=F").setName("Gold").setCategory("COMMODITIES").build());
                fallback.add(Asset.newBuilder().setSymbol("SI=F").setName("Silver").setCategory("COMMODITIES").build());
                fallback.add(
                        Asset.newBuilder().setSymbol("CL=F").setName("Crude Oil").setCategory("COMMODITIES").build());
                fallback.add(
                        Asset.newBuilder().setSymbol("NG=F").setName("Natural Gas").setCategory("COMMODITIES").build());
                fallback.add(Asset.newBuilder().setSymbol("HG=F").setName("Copper").setCategory("COMMODITIES").build());
                fallback.add(Asset.newBuilder().setSymbol("BZ=F").setName("Brent Crude Oil").setCategory("COMMODITIES")
                        .build());
                fallback.add(Asset.newBuilder().setSymbol("EURUSD=X").setName("EUR/USD").setCategory("FOREX").build());
                fallback.add(Asset.newBuilder().setSymbol("GBPUSD=X").setName("GBP/USD").setCategory("FOREX").build());
                fallback.add(Asset.newBuilder().setSymbol("USDJPY=X").setName("USD/JPY").setCategory("FOREX").build());
                // Colombian stocks
                fallback.add(Asset.newBuilder().setSymbol("EC").setName("Ecopetrol S.A.").setCategory("STOCKS").build());
                fallback.add(Asset.newBuilder().setSymbol("AVAL").setName("Grupo Aval Acciones y Valores").setCategory("STOCKS").build());
                fallback.add(Asset.newBuilder().setSymbol("BANCOLOMBIA").setName("Bancolombia S.A.").setCategory("STOCKS").build());
                fallback.add(Asset.newBuilder().setSymbol("PF").setName("Pfizer S.A.").setCategory("STOCKS").build());
                fallback.add(Asset.newBuilder().setSymbol("CEMEX").setName("CEMEX S.A.").setCategory("STOCKS").build());
                return fallback;
            }
            return List.of();
        }
    }

    public List<String> getAllAvailableSymbols() {
        try {
            EmptyRequest request = EmptyRequest.newBuilder().build();
            SymbolsResponse response = stubWithApiKey().getAvailableSymbols(request);
            return response.getSymbolsList();
        } catch (Exception e) {
            System.err.println("gRPC Get Symbols Error: " + e.getMessage());
// Fallback to static list if gRPC call fails
             return List.of(
                     "AAPL", "ADBE", "GOOGL", "MSFT", "AMZN", "TSLA", "META", "NVDA", "NFLX", "AMD",
                     "EC", "AVAL", "BANCOLOMBIA", "PF", "CEMEX",
                     "BTC-USD", "ETH-USD", "SOL-USD", "ADA-USD", "DOT-USD", "XRP-USD",
                     "GC=F", "SI=F", "CL=F", "NG=F", "EURUSD=X", "GBPUSD=X");
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

    public List<Asset> searchSymbols(String query) {
        try {
            SearchRequest request = SearchRequest.newBuilder()
                    .setQuery(query)
                    .setLimit(5)
                    .build();
            CategorizedAssetsResponse response = stubWithApiKey().searchSymbols(request);
            return response.getAssetsList();
        } catch (Exception e) {
            System.err.println("gRPC Search Symbols Error: " + e.getMessage());
            return List.of();
        }
    }
}
