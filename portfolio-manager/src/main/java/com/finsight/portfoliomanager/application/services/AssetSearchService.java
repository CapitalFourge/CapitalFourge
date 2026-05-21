package com.finsight.portfoliomanager.application.services;

import java.util.List;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.finsight.portfoliomanager.infrastructure.grpc.GrpcFinancialDataClient;

import java.util.Collections;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class AssetSearchService {
    private static final Logger log = LoggerFactory.getLogger(AssetSearchService.class);
    private static final long MOVERS_CACHE_TTL_MS = 60_000;

    private final GrpcFinancialDataClient grpcClient;
    private final Map<String, CachedMovers> moversCache = new ConcurrentHashMap<>();

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
            fallback.add(AssetInfo.builder().symbol("NVDA").name("NVIDIA Corp.").category("STOCKS").build());
            fallback.add(AssetInfo.builder().symbol("GC=F").name("Gold").category("COMMODITIES").build());
            fallback.add(AssetInfo.builder().symbol("SI=F").name("Silver").category("COMMODITIES").build());
            fallback.add(AssetInfo.builder().symbol("CL=F").name("Crude Oil").category("COMMODITIES").build());
            fallback.add(AssetInfo.builder().symbol("NG=F").name("Natural Gas").category("COMMODITIES").build());
            fallback.add(AssetInfo.builder().symbol("HG=F").name("Copper").category("COMMODITIES").build());
            fallback.add(AssetInfo.builder().symbol("BZ=F").name("Brent Crude Oil").category("COMMODITIES").build());
            fallback.add(AssetInfo.builder().symbol("EURUSD=X").name("EUR/USD").category("FOREX").build());
            fallback.add(AssetInfo.builder().symbol("GBPUSD=X").name("GBP/USD").category("FOREX").build());
            fallback.add(AssetInfo.builder().symbol("USDJPY=X").name("USD/JPY").category("FOREX").build());
            return fallback;
        }
    }

    public List<AssetSuggestion> searchSymbols(String query, int limit) {
        try {
            List<com.finsight.proto.Asset> allAssets = grpcClient.getCategorizedAssets();
            return allAssets.stream()
                    .filter(asset -> asset.getSymbol().toLowerCase().contains(query.toLowerCase()) ||
                            asset.getName().toLowerCase().contains(query.toLowerCase()))
                    .map(asset -> AssetSuggestion.builder()
                            .symbol(asset.getSymbol())
                            .name(asset.getName())
                            .build())
                    .limit(limit)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error searching symbols: {}", e.getMessage());
            // Return empty list on error
            return new ArrayList<>();
        }
    }

    public AssetInfo getAssetInfo(String symbol) {
        try {
            List<AssetInfo> allAssets = getCategorizedAssets(null);
            return allAssets.stream()
                    .filter(a -> a.getSymbol().equals(symbol))
                    .findFirst()
                    .orElse(null);
        } catch (Exception e) {
            log.error("Error getting asset info for symbol {}: {}", symbol, e.getMessage());
            return null;
        }
    }

    public List<AssetMover> getAssetMovers(String sort, int limit) {
        long now = System.currentTimeMillis();
        CachedMovers cached = moversCache.get(sort);
        if (cached != null && !cached.isExpired()) {
            return cached.movers();
        }

        List<AssetMover> movers = new ArrayList<>();
        try {
            List<com.finsight.proto.Asset> allAssets = grpcClient.getCategorizedAssets();
            for (com.finsight.proto.Asset asset : allAssets) {
                double price = grpcClient.getStockPrice(asset.getSymbol());
                double changePercent = 0.0; // Placeholder - in a real app, we would calculate change
                double changeValue = 0.0;
                movers.add(new AssetMover(
                        asset.getSymbol(),
                        asset.getName(),
                        price,
                        changePercent,
                        changeValue));
            }
        } catch (Exception e) {
            log.error("Error getting asset movers: {}", e.getMessage());
        }

        // Sort by changePercent (descending) if sort is "changePercent", otherwise by symbol
        if ("changePercent".equalsIgnoreCase(sort)) {
            movers.sort(Comparator.comparingDouble(AssetMover::getChangePercent).reversed());
        } else {
            movers.sort(Comparator.comparing(AssetMover::getSymbol));
        }

        if (limit > 0 && movers.size() > limit) {
            movers = movers.subList(0, limit);
        }

        moversCache.put(sort, new CachedMovers(movers));
        return movers;
    }

    public static class AssetInfo {
        private final String symbol;
        private final String name;
        private final String category;
        private final String description;
        private final String website;

        public AssetInfo(String symbol, String name, String category, String description, String website) {
            this.symbol = symbol;
            this.name = name;
            this.category = category;
            this.description = description;
            this.website = website;
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

        public String getDescription() {
            return description;
        }

        public String getWebsite() {
            return website;
        }

        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private String symbol;
            private String name;
            private String category;
            private String description;
            private String website;

            public Builder symbol(String symbol) {
                this.symbol = symbol;
                return this;
            }

            public Builder name(String name) {
                this.name = name;
                return this;
            }

            public Builder category(String category) {
                this.category = category;
                return this;
            }

            public Builder description(String description) {
                this.description = description;
                return this;
            }

            public Builder website(String website) {
                this.website = website;
                return this;
            }

            public AssetInfo build() {
                return new AssetInfo(symbol, name, category, description, website);
            }
        }
    }

    public static class AssetMover {
        private final String symbol;
        private final String name;
        private final double price;
        private final double changePercent;
        private final double changeValue;

        public AssetMover(String symbol, String name, double price, double changePercent, double changeValue) {
            this.symbol = symbol;
            this.name = name;
            this.price = price;
            this.changePercent = changePercent;
            this.changeValue = changeValue;
        }

        public String getSymbol() {
            return symbol;
        }

        public String getName() {
            return name;
        }

        public double getPrice() {
            return price;
        }

        public double getChangePercent() {
            return changePercent;
        }

        public double getChangeValue() {
            return changeValue;
        }

        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private String symbol;
            private String name;
            private double price;
            private double changePercent;
            private double changeValue;

            public Builder symbol(String symbol) {
                this.symbol = symbol;
                return this;
            }

            public Builder name(String name) {
                this.name = name;
                return this;
            }

            public Builder price(double price) {
                this.price = price;
                return this;
            }

            public Builder changePercent(double changePercent) {
                this.changePercent = changePercent;
                return this;
            }

            public Builder changeValue(double changeValue) {
                this.changeValue = changeValue;
                return this;
            }

            public AssetMover build() {
                return new AssetMover(symbol, name, price, changePercent, changeValue);
            }
        }
    }

    public static class AssetSuggestion {
        private final String symbol;
        private final String name;

        public AssetSuggestion(String symbol, String name) {
            this.symbol = symbol;
            this.name = name;
        }

        public String getSymbol() {
            return symbol;
        }

        public String getName() {
            return name;
        }

        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private String symbol;
            private String name;

            public Builder symbol(String symbol) {
                this.symbol = symbol;
                return this;
            }

            public Builder name(String name) {
                this.name = name;
                return this;
            }

            public AssetSuggestion build() {
                return new AssetSuggestion(symbol, name);
            }
        }
    }

    private record CachedMovers(List<AssetMover> movers, long createdAt) {
        private CachedMovers(List<AssetMover> movers) {
            this(List.copyOf(movers), System.currentTimeMillis());
        }

        private boolean isExpired() {
            return System.currentTimeMillis() - createdAt > MOVERS_CACHE_TTL_MS;
        }
    }
}