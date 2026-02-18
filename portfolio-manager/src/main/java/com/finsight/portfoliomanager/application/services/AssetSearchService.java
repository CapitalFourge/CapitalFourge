package com.finsight.portfoliomanager.application.services;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.finsight.portfoliomanager.infrastructure.grpc.GrpcFinancialDataClient;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AssetSearchService {

    private final GrpcFinancialDataClient grpcClient;

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

    @Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class AssetSuggestion {

        private String symbol;
        private String name;
    }
}
