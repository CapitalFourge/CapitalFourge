package com.capitalfourge.portfoliomanager.infrastructure.grpc;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import com.capitalfourge.proto.*;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

import lombok.extern.slf4j.Slf4j;

/**
 * REST client for data-collector service (replaces gRPC client).
 * Calls FastAPI REST endpoints on data-collector.
 * 
 * Uses Caffeine cache (TTL 1 hour, max 500 entries) to reduce Upstash reads/writes.
 */
@Service
@Slf4j
public class GrpcFinancialDataClient {

    private final RestTemplate restTemplate;
    private final String baseUrl;
    private final String apiKey;

    // Caffeine cache: symbol -> CachedPrice
    // Max 500 entries, expire after 1 hour write, record stats for monitoring
    private static final Cache<String, CachedPrice> priceCache = Caffeine.newBuilder()
            .maximumSize(500)
            .expireAfterWrite(Duration.ofHours(1))
            .recordStats()
            .build();

    private static class CachedPrice {
        final double price;
        final Instant timestamp;

        CachedPrice(double price, Instant timestamp) {
            this.price = price;
            this.timestamp = timestamp;
        }

        // P2-2: Use >= for correct 1-hour TTL (not > which adds 1ns)
        boolean isExpired() {
            return Duration.between(timestamp, Instant.now()).compareTo(Duration.ofHours(1)) >= 0;
        }
    }

    // Track cache timestamps for UI display
    private static final Map<String, String> cacheTimestamps = new ConcurrentHashMap<>();

    public String getCachedAt(String symbol) {
        return cacheTimestamps.get(symbol);
    }

    public GrpcFinancialDataClient(
            RestTemplateBuilder restTemplateBuilder,
            @Value("${spring.data-collector.base-url:http://localhost:8000}") String baseUrl,
            @Value("${spring.data-collector.api-key:internal-service-key}") String apiKey) {

        // Configure timeouts - data-collector can take 40-50s due to yfinance
        this.restTemplate = restTemplateBuilder
                .setConnectTimeout(Duration.ofSeconds(10))
                .setReadTimeout(Duration.ofSeconds(60))
                .build();
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
    }

    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-API-Key", apiKey);
        return headers;
    }

    private <T> T get(String path, Class<T> responseType) {
        try {
            HttpEntity<?> entity = new HttpEntity<>(createHeaders());
            ResponseEntity<T> response = restTemplate.exchange(
                    baseUrl + path, HttpMethod.GET, entity, responseType);
            return response.getBody();
        } catch (Exception e) {
            log.error("REST GET error for {}", path, e);
            return null;
        }
    }

    private <T, R> R post(String path, T request, Class<R> responseType) {
        try {
            HttpEntity<T> entity = new HttpEntity<>(request, createHeaders());
            ResponseEntity<R> response = restTemplate.exchange(
                    baseUrl + path, HttpMethod.POST, entity, responseType);
            return response.getBody();
        } catch (Exception e) {
            log.error("REST POST error for {}", path, e);
            return null;
        }
    }

    // ==================== EXISTING METHODS (kept for compatibility) ====================

    public Double getStockPrice(String symbol) {
        Map<String, Double> prices = getBatchPrices(List.of(symbol));
        return prices.getOrDefault(symbol, 0.0);
    }

    public Map<String, Double> getBatchPrices(List<String> symbols) {
        Map<String, Double> result = new HashMap<>();
        List<String> symbolsToFetch = new ArrayList<>();

        // Check cache first
        for (String symbol : symbols) {
            CachedPrice cached = priceCache.getIfPresent(symbol);
            if (cached != null && !cached.isExpired()) {
                result.put(symbol, cached.price);
            } else {
                symbolsToFetch.add(symbol);
            }
        }

        // Fetch only missing/expired symbols
        if (!symbolsToFetch.isEmpty()) {
            // P2-3: Use UriComponentsBuilder for safe URL encoding
            String path = UriComponentsBuilder.fromPath("/prices/batch")
                    .queryParam("symbols", String.join(",", symbolsToFetch))
                    .toUriString();
            Map<String, Object> response = get(path, Map.class);

            // P2-4: Validate response structure before casting
            if (response != null && response.containsKey("prices")) {
                Object pricesObj = response.get("prices");
                if (pricesObj instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> prices = (Map<String, Object>) pricesObj;
                    String now = Instant.now().toString();
                    for (Map.Entry<String, Object> entry : prices.entrySet()) {
                        double price = entry.getValue() instanceof Number ? ((Number) entry.getValue()).doubleValue() : 0.0;
                        result.put(entry.getKey(), price);
                        // Update cache
                        priceCache.put(entry.getKey(), new CachedPrice(price, Instant.now()));
                        cacheTimestamps.put(entry.getKey(), now);
                    }
                }
            }
        }

        return result;
    }

    public List<PricePoint> getPriceHistory(String symbol, int days) {
        // P2-3: Safe URL encoding
        String path = UriComponentsBuilder.fromPath("/price/history/" + symbol)
                .queryParam("days", days)
                .toUriString();
        List<Map<String, Object>> response = get(path, List.class);

        if (response != null) {
            return response.stream().map(point -> {
                PricePoint.Builder builder = PricePoint.newBuilder();
                if (point.get("timestamp") != null) builder.setDate(point.get("timestamp").toString());
                if (point.get("price") != null) builder.setClose(((Number) point.get("price")).doubleValue());
                if (point.get("volume") != null) builder.setVolume(((Number) point.get("volume")).longValue());
                return builder.build();
            }).collect(Collectors.toList());
        }
        return List.of();
    }

    public List<Asset> getCategorizedAssets() {
        // P2-3: Safe URL encoding
        String path = UriComponentsBuilder.fromPath("/assets/categorized").toUriString();
        List<Map<String, Object>> response = get(path, List.class);

        if (response != null) {
            return response.stream().map(item -> {
                Asset.Builder builder = Asset.newBuilder();
                builder.setSymbol((String) item.getOrDefault("symbol", ""));
                builder.setName((String) item.getOrDefault("name", ""));
                builder.setCategory((String) item.getOrDefault("category", ""));
                return builder.build();
            }).collect(Collectors.toList());
        }
        return List.of();
    }

    public List<String> getAllAvailableSymbols() {
        // P2-3: Safe URL encoding
        String path = UriComponentsBuilder.fromPath("/assets/symbols").toUriString();
        List<?> response = get(path, List.class);
        if (response != null) {
            return response.stream().map(Object::toString).collect(Collectors.toList());
        }
        return List.of();
    }

    public List<Asset> searchSymbols(String query, int limit) {
        Map<String, Object> request = Map.of("query", query, "limit", limit);
        List<Map<String, Object>> response = post("/assets/search", request, List.class);

        if (response != null) {
            return response.stream().map(item -> {
                Asset.Builder builder = Asset.newBuilder();
                builder.setSymbol((String) item.getOrDefault("symbol", ""));
                builder.setName((String) item.getOrDefault("name", ""));
                builder.setCategory((String) item.getOrDefault("category", ""));
                return builder.build();
            }).collect(Collectors.toList());
        }
        return List.of();
    }

    public String getAssetName(String symbol) {
        Map<String, Object> response = get("/asset/name/" + symbol, Map.class);
        if (response != null && response.containsKey("name")) {
            return (String) response.get("name");
        }
        return symbol;
    }

    // Expose cache stats for monitoring
    public Object getCacheStats() {
        return priceCache.stats();
    }

    // Clear entire cache (for testing)
    public void invalidateAll() {
        priceCache.invalidateAll();
        cacheTimestamps.clear();
    }

    // Public record for actuator endpoint
    public record CacheMetrics(
        long estimatedSize,
        long hitCount,
        long missCount,
        double hitRate,
        long loadSuccessCount,
        long loadFailureCount,
        long totalLoadTimeNanos,
        long evictionCount
    ) {}

    public CacheMetrics getCacheMetrics() {
        var stats = priceCache.stats();
        return new CacheMetrics(
            priceCache.estimatedSize(),
            stats.hitCount(),
            stats.missCount(),
            stats.hitRate(),
            stats.loadSuccessCount(),
            stats.loadFailureCount(),
            stats.totalLoadTime(),
            stats.evictionCount()
        );
    }
}