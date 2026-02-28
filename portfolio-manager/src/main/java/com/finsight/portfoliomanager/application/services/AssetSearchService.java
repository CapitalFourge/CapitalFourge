package com.finsight.portfoliomanager.application.services;

import java.util.List;
import java.util.ArrayList;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.finsight.portfoliomanager.infrastructure.grpc.GrpcFinancialDataClient;

import java.util.Collections;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class AssetSearchService {
    private static final Logger log = LoggerFactory.getLogger(AssetSearchService.class);

    private final GrpcFinancialDataClient grpcClient;

    public AssetSearchService(GrpcFinancialDataClient grpcClient) {
        this.grpcClient = grpcClient;
    }

    public List<AssetInfo> getCategorizedAssets(String category) {
        try {
            List<com.finsight.proto.Asset> allAssets = grpcClient.getCategorizedAssets();
            return allAssets.stream()
                    .filter(a -> category == null || a.getCategory().equalsIgnoreCase(category))
                    .map(a -> AssetInfo.builder()
                            .symbol(a.getSymbol())
                            .name(a.getName())
                            .category(a.getCategory())
                            .build())
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error getting categorized assets: {}", e.getMessage());
            // Fallback to a small static asset set if gRPC is unavailable.
            // Category names MUST match those used by the gRPC server and the frontend
            // (uppercase).
            List<AssetInfo> fallback = new ArrayList<>();
            fallback.add(AssetInfo.builder().symbol("BTC-USD").name("Bitcoin").category("CRYPTO").build());
            fallback.add(AssetInfo.builder().symbol("ETH-USD").name("Ethereum").category("CRYPTO").build());
            fallback.add(AssetInfo.builder().symbol("SOL-USD").name("Solana").category("CRYPTO").build());
            fallback.add(AssetInfo.builder().symbol("AAPL").name("Apple Inc.").category("STOCKS").build());
            fallback.add(AssetInfo.builder().symbol("MSFT").name("Microsoft Corp.").category("STOCKS").build());
            fallback.add(AssetInfo.builder().symbol("XAUUSD=C").name("Gold").category("COMMODITIES").build());
            fallback.add(AssetInfo.builder().symbol("EURUSD=X").name("EUR/USD").category("FOREX").build());

            if (category == null) {
                return fallback;
            } else {
                return fallback.stream()
                        .filter(a -> category.equalsIgnoreCase(a.getCategory()))
                        .collect(Collectors.toList());
            }
        }
    }

    public List<AssetSuggestion> searchSymbols(String query, int limit) {
        if (query == null || query.trim().length() < 2) {
            return List.of();
        }

        try {
            // Get all available symbols from data collector
            List<String> allSymbols = grpcClient.getAllAvailableSymbols();
            log.info("🔍 Search query: '{}', Total available symbols: {}", query, allSymbols.size());
            log.info("📋 Available symbols: {}", allSymbols);

            String queryLower = query.toLowerCase();

            // Filter and rank by similarity with priority:
            // 1. Exact match (e.g., "BTC" matches "BTC")
            // 2. Starts with query (e.g., "BTC" matches "BTC-USD")
            // 3. Contains query (e.g., "BTC" matches "ABTC")
            List<AssetSuggestion> results = allSymbols.stream()
                    .filter(symbol -> symbol.toLowerCase().contains(queryLower))
                    .sorted((a, b) -> {
                        String aLower = a.toLowerCase();
                        String bLower = b.toLowerCase();

                        // Priority 1: Exact match
                        boolean aExact = aLower.equals(queryLower);
                        boolean bExact = bLower.equals(queryLower);
                        if (aExact && !bExact) {
                            return -1;
                        }
                        if (!aExact && bExact) {
                            return 1;
                        }

                        // Priority 2: Starts with query
                        boolean aStarts = aLower.startsWith(queryLower);
                        boolean bStarts = bLower.startsWith(queryLower);
                        if (aStarts && !bStarts) {
                            return -1;
                        }
                        if (!aStarts && bStarts) {
                            return 1;
                        }

                        // Priority 3: Alphabetical order for same priority
                        return a.compareTo(b);
                    })
                    .limit(limit)
                    .map(symbol -> AssetSuggestion.builder()
                            .symbol(symbol)
                            .name(getAssetName(symbol))
                            .build())
                    .collect(Collectors.toList());

            log.info("✅ Found {} results for query '{}': {}", results.size(), query,
                    results.stream().map(AssetSuggestion::getSymbol).collect(Collectors.toList()));
            return results;
        } catch (Exception e) {
            log.error("Error searching symbols: {}", e.getMessage());
            return List.of();
        }
    }

    private String getAssetName(String symbol) {
        try {
            // Fetch asset name from data collector or cache
            return grpcClient.getAssetName(symbol);
        } catch (Exception e) {
            log.debug("Could not fetch name for symbol {}: {}", symbol, e.getMessage());
            return null;
        }
    }

    public static class AssetInfo {
        private String symbol;
        private String name;
        private String category;

        private AssetInfo(String symbol, String name, String category) {
            this.symbol = symbol;
            this.name = name;
            this.category = category;
        }

        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private String symbol;
            private String name;
            private String category;

            public Builder symbol(String s) {
                this.symbol = s;
                return this;
            }

            public Builder name(String n) {
                this.name = n;
                return this;
            }

            public Builder category(String c) {
                this.category = c;
                return this;
            }

            public AssetInfo build() {
                return new AssetInfo(symbol, name, category);
            }
        }

        public String getSymbol() {
            return symbol;
        }

        public String getName() {
            return name;
        }

        public String getCategory() {
            return category;
        }
    }

    public static class AssetSuggestion {
        private String symbol;
        private String name;

        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private String symbol;
            private String name;

            public Builder symbol(String s) {
                this.symbol = s;
                return this;
            }

            public Builder name(String n) {
                this.name = n;
                return this;
            }

            public AssetSuggestion build() {
                return new AssetSuggestion(symbol, name);
            }
        }

        private AssetSuggestion(String symbol, String name) {
            this.symbol = symbol;
            this.name = name;
        }

        public String getSymbol() {
            return symbol;
        }

        public String getName() {
            return name;
        }
    }
}
