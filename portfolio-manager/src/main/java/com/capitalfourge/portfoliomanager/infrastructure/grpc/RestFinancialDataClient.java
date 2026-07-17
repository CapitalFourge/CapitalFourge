package com.capitalfourge.portfoliomanager.infrastructure.grpc;

import com.capitalfourge.proto.Asset;
import com.capitalfourge.proto.CategorizedAssetsResponse;
import com.capitalfourge.proto.SearchRequest;
import com.capitalfourge.proto.SymbolsResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@ConditionalOnProperty(name = "data-collector.rest.enabled", havingValue = "true", matchIfMissing = true)
public class RestFinancialDataClient {

    private final WebClient webClient;

    public RestFinancialDataClient(
            @Value("${data-collector.base-url:http://localhost:8000}") String baseUrl,
            @Value("${grpc.data-collector.api-key:internal-service-key}") String apiKey) {
        
        this.webClient = WebClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader("X-API-Key", apiKey)
                .build();
    }

    public Double getStockPrice(String symbol) {
        try {
            Map response = webClient.get()
                    .uri("/price/{symbol}", symbol)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
            
            if (response != null && response.get("price") != null) {
                return ((Number) response.get("price")).doubleValue();
            }
        } catch (Exception e) {
            System.err.println("REST getStockPrice error: " + e.getMessage());
        }
        return 0.0;
    }

    public Map<String, Double> getBatchPrices(List<String> symbols) {
        try {
            String symbolsParam = String.join(",", symbols);
            Map response = webClient.get()
                    .uri(uriBuilder -> uriBuilder.path("/prices/batch")
                            .queryParam("symbols", symbolsParam)
                            .build())
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
            
            if (response != null && response.get("prices") != null) {
                @SuppressWarnings("unchecked")
                Map<String, Object> prices = (Map<String, Object>) response.get("prices");
                return prices.entrySet().stream()
                        .collect(Collectors.toMap(
                                Map.Entry::getKey,
                                e -> ((Number) e.getValue()).doubleValue()
                        ));
            }
        } catch (Exception e) {
            System.err.println("REST getBatchPrices error: " + e.getMessage());
        }
        return Map.of();
    }

    public List<Map<String, Object>> getPriceHistory(String symbol, int days) {
        try {
            List response = webClient.get()
                    .uri(uriBuilder -> uriBuilder.path("/price/history/{symbol}")
                            .queryParam("days", days)
                            .build(symbol))
                    .retrieve()
                    .bodyToMono(List.class)
                    .block();
            
            return response != null ? response : List.of();
        } catch (Exception e) {
            System.err.println("REST getPriceHistory error: " + e.getMessage());
        }
        return List.of();
    }

    public List<Asset> getCategorizedAssets() {
        try {
            List response = webClient.get()
                    .uri("/assets/categorized")
                    .retrieve()
                    .bodyToMono(List.class)
                    .block();
            
            if (response != null) {
                return response.stream()
                        .map(item -> {
                            @SuppressWarnings("unchecked")
                            Map<String, Object> m = (Map<String, Object>) item;
                            return Asset.newBuilder()
                                    .setSymbol((String) m.getOrDefault("symbol", ""))
                                    .setName((String) m.getOrDefault("name", ""))
                                    .setCategory((String) m.getOrDefault("category", ""))
                                    .build();
                        })
                        .collect(Collectors.toList());
            }
        } catch (Exception e) {
            System.err.println("REST getCategorizedAssets error: " + e.getMessage());
        }
        return List.of();
    }

    public List<String> getAllAvailableSymbols() {
        try {
            List response = webClient.get()
                    .uri("/assets/symbols")
                    .retrieve()
                    .bodyToMono(List.class)
                    .block();
            
            return response != null ? response.stream()
                    .map(Object::toString)
                    .collect(Collectors.toList()) : List.of();
        } catch (Exception e) {
            System.err.println("REST getAllAvailableSymbols error: " + e.getMessage());
        }
        return List.of();
    }

    public List<Asset> searchSymbols(String query, int limit) {
        try {
            Map request = Map.of("query", query, "limit", limit);
            List response = webClient.post()
                    .uri("/assets/search")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(List.class)
                    .block();
            
            if (response != null) {
                return response.stream()
                        .map(item -> {
                            @SuppressWarnings("unchecked")
                            Map<String, Object> m = (Map<String, Object>) item;
                            return Asset.newBuilder()
                                    .setSymbol((String) m.getOrDefault("symbol", ""))
                                    .setName((String) m.getOrDefault("name", ""))
                                    .setCategory((String) m.getOrDefault("category", ""))
                                    .build();
                        })
                        .collect(Collectors.toList());
            }
        } catch (Exception e) {
            System.err.println("REST searchSymbols error: " + e.getMessage());
        }
        return List.of();
    }

    public String getAssetName(String symbol) {
        try {
            Map response = webClient.get()
                    .uri("/asset/name/{symbol}", symbol)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
            
            if (response != null && response.get("name") != null) {
                return (String) response.get("name");
            }
        } catch (Exception e) {
            System.err.println("REST getAssetName error: " + e.getMessage());
        }
        return symbol;
    }
}
