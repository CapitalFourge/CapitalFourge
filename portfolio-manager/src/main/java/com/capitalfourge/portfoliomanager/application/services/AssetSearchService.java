package com.capitalfourge.portfoliomanager.application.services;

import java.util.List;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.capitalfourge.portfoliomanager.infrastructure.grpc.GrpcFinancialDataClient;

import java.util.Collections;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.capitalfourge.portfoliomanager.application.ports.out.MetricRepository;

@Service
public class AssetSearchService {
    private static final Logger log = LoggerFactory.getLogger(AssetSearchService.class);
    private static final long MOVERS_CACHE_TTL_MS = 60_000;

    private final GrpcFinancialDataClient grpcClient;
    private final MetricRepository metricRepository;
    private final Map<String, CachedMovers> moversCache = new ConcurrentHashMap<>();

    public AssetSearchService(GrpcFinancialDataClient grpcClient, MetricRepository metricRepository) {
        this.grpcClient = grpcClient;
        this.metricRepository = metricRepository;
    }

    public List<AssetInfo> getCategorizedAssets(String category) {
        try {
            List<com.capitalfourge.proto.Asset> allAssets = grpcClient.getCategorizedAssets();
            return allAssets.stream()
                    .filter(a -> category == null || a.getCategory().equalsIgnoreCase(category))
                    .map(a -> AssetInfo.builder()
                            .symbol(a.getSymbol())
                            .name(a.getName())
                            .category(a.getCategory())
                            .description(a.getDescription())
                            .website(a.getWebsite())
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
            fallback.add(AssetInfo.builder().symbol("ADBE").name("Adobe Inc.").category("STOCKS").build());
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
        if (query == null || query.trim().length() < 1) {
            return List.of();
        }

        try {
            String upperQuery = query.trim().toUpperCase();

            // Get all categorized assets which have both symbol AND name
            List<com.capitalfourge.proto.Asset> allAssets = grpcClient.getCategorizedAssets();

            log.info("🔍 Search query: '{}', Total available assets: {}", query, allAssets.size());

            String queryLower = query.toLowerCase();

            // Search both symbol AND name fields
            List<AssetSuggestion> results = allAssets.stream()
                    .filter(asset -> {
                        String symbolLower = asset.getSymbol().toLowerCase();
                        String nameLower = asset.getName() != null ? asset.getName().toLowerCase() : "";
                        return symbolLower.contains(queryLower) ||
                               nameLower.contains(queryLower);
                    })
                    .sorted((a, b) -> {
                        String aSymbol = a.getSymbol().toLowerCase();
                        String bSymbol = b.getSymbol().toLowerCase();
                        String aName = a.getName() != null ? a.getName().toLowerCase() : "";
                        String bName = b.getName() != null ? b.getName().toLowerCase() : "";

                        // Priority 1: Symbol exact match
                        boolean aSymbolExact = aSymbol.equals(queryLower);
                        boolean bSymbolExact = bSymbol.equals(queryLower);
                        if (aSymbolExact && !bSymbolExact) return -1;
                        if (!aSymbolExact && bSymbolExact) return 1;

                        // Priority 2: Name exact match
                        boolean aNameExact = aName.equals(queryLower);
                        boolean bNameExact = bName.equals(queryLower);
                        if (aNameExact && !bNameExact) return -1;
                        if (!aNameExact && bNameExact) return 1;

                        // Priority 3: Symbol starts with query
                        boolean aStarts = aSymbol.startsWith(queryLower);
                        boolean bStarts = bSymbol.startsWith(queryLower);
                        if (aStarts && !bStarts) return -1;
                        if (!aStarts && bStarts) return 1;

                        // Priority 4: Name starts with query
                        boolean aNameStarts = aName.startsWith(queryLower);
                        boolean bNameStarts = bName.startsWith(queryLower);
                        if (aNameStarts && !bNameStarts) return -1;
                        if (!aNameStarts && bNameStarts) return 1;

                        // Priority 5: Alphabetical order for same priority
                        return a.getSymbol().compareTo(b.getSymbol());
                    })
.limit(limit)
                     .map(asset -> AssetSuggestion.builder()
                             .symbol(asset.getSymbol())
                             .name(asset.getName())
                             .category(asset.getCategory())
                             .build())
                     .collect(Collectors.toList());

            // If no results found but symbol looks valid, check if it has price data
            // Allow Colombian stock tickers (EC, AVAL, BANCOLOMBIA, etc.) and standard formats
            if (results.isEmpty() && upperQuery.matches("^[A-Z]{1,12}(\\-[A-Z]{3})?(\\=\\w{1,2})?$")) {
                try {
                    String assetName = grpcClient.getAssetName(upperQuery);
                    // If we get a name or the symbol exists, create a suggestion
if (assetName != null && !assetName.equals(upperQuery)) {
                         results.add(AssetSuggestion.builder()
                                 .symbol(upperQuery)
                                 .name(assetName)
                                 .category(inferCategory(upperQuery))
                                 .build());
                     } else {
                         // Validate symbol exists by checking if we can get price history
                         List<com.capitalfourge.proto.PricePoint> history = grpcClient.getPriceHistory(upperQuery, 1);
                         if (history != null && !history.isEmpty()) {
                             results.add(AssetSuggestion.builder()
                                     .symbol(upperQuery)
                                     .name(null) // Will show symbol as name
                                     .category(inferCategory(upperQuery))
                                     .build());
                         }
                     }
                } catch (Exception e) {
                    log.debug("Could not validate symbol {}: {}", upperQuery, e.getMessage());
                }
            }

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

    public List<AssetMover> getAssetMovers(String sort, int limit) {
        int safeLimit = limit > 0 ? Math.min(limit, 12) : 8;
        String safeSort = sort == null ? "volatile" : sort.toLowerCase();
        String cacheKey = safeSort + ":" + safeLimit;

        CachedMovers cached = moversCache.get(cacheKey);
        if (cached != null && !cached.isExpired()) {
            return cached.movers();
        }

        try {
            List<String> symbols = grpcClient.getAllAvailableSymbols();

            List<AssetMover> movers = symbols.parallelStream()
                    .map(symbol -> buildAssetMover(symbol, getAssetName(symbol)))
                    .filter(mover -> mover != null)
                    .sorted(getMoverComparator(safeSort))
                    .limit(safeLimit)
                    .collect(Collectors.toList());

            moversCache.put(cacheKey, new CachedMovers(movers));
            return movers;
        } catch (Exception e) {
            log.error("Error getting asset movers: {}", e.getMessage());
            return List.of();
        }
    }

    private AssetMover buildAssetMover(String symbol, String name) {
        try {
            List<com.capitalfourge.proto.PricePoint> history = grpcClient.getPriceHistory(symbol, 5);
            if (history == null || history.size() < 2) {
                return null;
            }

            double latestPrice = history.get(history.size() - 1).getClose();
            double previousPrice = history.get(history.size() - 2).getClose();

            if (previousPrice == 0) {
                return null;
            }

            double changeValue = latestPrice - previousPrice;
            double changePercent = (changeValue / previousPrice) * 100.0;
            double volume = metricRepository.getAssetVolume(symbol);

            return AssetMover.builder()
                    .symbol(symbol)
                    .name(name)
                    .price(latestPrice)
                    .changePercent(changePercent)
                    .changeValue(changeValue)
                    .volume(volume)
                    .build();
        } catch (Exception e) {
            log.debug("Could not build mover for {}: {}", symbol, e.getMessage());
            return null;
        }
    }

    public AssetInfo getAssetInfo(String symbol) {
        if (symbol == null || symbol.isBlank()) {
            return null;
        }

        return getCategorizedAssets(null).stream()
                .filter(asset -> symbol.equalsIgnoreCase(asset.getSymbol()))
                .findFirst()
                .orElse(AssetInfo.builder()
                        .symbol(symbol)
                        .name(getAssetName(symbol))
                        .category(inferCategory(symbol))
                        .build());
    }

    private Comparator<AssetMover> getMoverComparator(String sort) {
        return switch (sort) {
            case "gain" -> Comparator.comparingDouble(AssetMover::getChangePercent).reversed();
            case "loss" -> Comparator.comparingDouble(AssetMover::getChangePercent);
            default -> Comparator.comparingDouble((AssetMover mover) -> Math.abs(mover.getChangePercent())).reversed();
        };
    }

    public static class AssetInfo {
        private String symbol;
        private String name;
        private String category;
        private String description;
        private String website;

        private AssetInfo(String symbol, String name, String category, String description, String website) {
            this.symbol = symbol;
            this.name = name;
            this.category = category;
            this.description = description;
            this.website = website;
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

            public Builder description(String d) {
                this.description = d;
                return this;
            }

            public Builder website(String w) {
                this.website = w;
                return this;
            }

            public AssetInfo build() {
                return new AssetInfo(symbol, name, category, description, website);
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

        public String getDescription() {
            return description;
        }

        public String getWebsite() {
            return website;
        }
    }

    public static class AssetSuggestion {
        private String symbol;
        private String name;
        private String category;

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

            public AssetSuggestion build() {
                return new AssetSuggestion(symbol, name, category);
            }
        }

        private AssetSuggestion(String symbol, String name, String category) {
            this.symbol = symbol;
            this.name = name;
            this.category = category;
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

    public static class AssetMover {
        private String symbol;
        private String name;
        private double price;
        private double changePercent;
        private double changeValue;
        private double volume;

        private AssetMover(String symbol, String name, double price, double changePercent, double changeValue, double volume) {
            this.symbol = symbol;
            this.name = name;
            this.price = price;
            this.changePercent = changePercent;
            this.changeValue = changeValue;
            this.volume = volume;
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
            private double volume;

            public Builder symbol(String s) {
                this.symbol = s;
                return this;
            }

            public Builder name(String n) {
                this.name = n;
                return this;
            }

            public Builder price(double p) {
                this.price = p;
                return this;
            }

            public Builder changePercent(double c) {
                this.changePercent = c;
                return this;
            }

            public Builder changeValue(double c) {
                this.changeValue = c;
                return this;
            }

            public Builder volume(double v) {
                this.volume = v;
                return this;
            }

            public AssetMover build() {
                return new AssetMover(symbol, name, price, changePercent, changeValue, volume);
            }
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

        public double getVolume() {
            return volume;
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

    private String inferCategory(String symbol) {
        if (symbol.endsWith("-USD")) {
            return "CRYPTO";
        }
        if (symbol.endsWith("=F")) {
            return "COMMODITIES";
        }
        if (symbol.endsWith("=X")) {
            return "FOREX";
        }
        // Colombian stock tickers
        if (symbol.equals("EC") || symbol.equals("ECOL") ||
            symbol.equals("AVAL") || symbol.equals("BANCOLOMBIA") ||
            symbol.equals("PF") || symbol.equals("CEMEX") ||
            symbol.equals("CEMEXCOL") || symbol.equals("CIBEST")) {
            return "STOCKS";
        }
        return "STOCKS";
    }
}
