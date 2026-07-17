package com.capitalfourge.portfoliomanager.infrastructure.grpc;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.capitalfourge.proto.*;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

/**
 * REST client for data-collector service (replaces gRPC client).
 * Calls FastAPI REST endpoints on data-collector
 */
@Service
public class GrpcFinancialDataClient {

    private final RestTemplate restTemplate;
    private final String baseUrl;
    private final String apiKey;

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
            System.err.println("REST GET error for " + path + ": " + e.getMessage());
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
            System.err.println("REST POST error for " + path + ": " + e.getMessage());
            return null;
        }
    }

    // ==================== EXISTING METHODS (kept for compatibility) ====================

    public Double getStockPrice(String symbol) {
        Map<String, Double> prices = getBatchPrices(List.of(symbol));
        return prices.getOrDefault(symbol, 0.0);
    }

    public Map<String, Double> getBatchPrices(List<String> symbols) {
        String symbolsParam = String.join(",", symbols);
        Map<String, Object> response = get("/prices/batch?symbols=" + symbolsParam, Map.class);
        
        if (response != null && response.containsKey("prices")) {
            @SuppressWarnings("unchecked")
            Map<String, Object> prices = (Map<String, Object>) response.get("prices");
            return prices.entrySet().stream()
                    .collect(Collectors.toMap(
                            Map.Entry::getKey,
                            e -> e.getValue() instanceof Number ? ((Number) e.getValue()).doubleValue() : 0.0
                    ));
        }
        return Map.of();
    }

    public List<PricePoint> getPriceHistory(String symbol, int days) {
        List<Map<String, Object>> response = get("/price/history/" + symbol + "?days=" + days, List.class);
        
        if (response != null) {
            return response.stream().map(point -> {
                PricePoint.Builder builder = PricePoint.newBuilder();
                // REST returns: timestamp, price, volume
                if (point.get("timestamp") != null) builder.setDate(point.get("timestamp").toString());
                if (point.get("price") != null) builder.setClose(((Number) point.get("price")).doubleValue());
                if (point.get("volume") != null) builder.setVolume(((Number) point.get("volume")).longValue());
                return builder.build();
            }).collect(Collectors.toList());
        }
        return List.of();
    }

    public List<Asset> getCategorizedAssets() {
        List<Map<String, Object>> response = get("/assets/categorized", List.class);
        
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
        List<?> response = get("/assets/symbols", List.class);
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
}