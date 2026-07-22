package com.capitalfourge.portfoliomanager.infrastructure.grpc;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GrpcFinancialDataClientTest {

    @Mock
    private RestTemplateBuilder restTemplateBuilder;

    @Mock
    private RestTemplate restTemplate;

    private GrpcFinancialDataClient client;

    @BeforeEach
    void setUp() {
        lenient().when(restTemplateBuilder.setConnectTimeout(any(Duration.class)))
                .thenReturn(restTemplateBuilder);
        lenient().when(restTemplateBuilder.setReadTimeout(any(Duration.class)))
                .thenReturn(restTemplateBuilder);
        lenient().when(restTemplateBuilder.build()).thenReturn(restTemplate);

        client = new GrpcFinancialDataClient(
                restTemplateBuilder,
                "https://test-data-collector.example.com",
                "test-api-key"
        );
        
        // Clear cache before each test
        client.invalidateAll();
    }

    @Test
    void getStockPrice_returnsPrice_whenSuccessful() {
        Map<String, Object> prices = Map.of("prices", Map.of("AAPL", 150.0));
        ResponseEntity<Map> response = new ResponseEntity<>(prices, HttpStatus.OK);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(Map.class)))
                .thenReturn(response);

        Double price = client.getStockPrice("AAPL");

        assertEquals(150.0, price);
    }

    @Test
    void getStockPrice_returnsZero_whenError() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(Map.class)))
                .thenThrow(new RuntimeException("Network error"));

        Double price = client.getStockPrice("AAPL");

        assertEquals(0.0, price);
    }

    @Test
    void getBatchPrices_returnsPrices_whenSuccessful() {
        Map<String, Object> responseMap = Map.of(
                "prices", Map.of(
                        "AAPL", 150.0,
                        "MSFT", 300.0,
                        "GOOGL", 2800.0
                )
        );
        ResponseEntity<Map> response = new ResponseEntity<>(responseMap, HttpStatus.OK);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(Map.class)))
                .thenReturn(response);

        Map<String, Double> prices = client.getBatchPrices(List.of("AAPL", "MSFT", "GOOGL"));

        assertEquals(3, prices.size());
        assertEquals(150.0, prices.get("AAPL"));
        assertEquals(300.0, prices.get("MSFT"));
        assertEquals(2800.0, prices.get("GOOGL"));
    }

    @Test
    void getBatchPrices_returnsEmptyMap_whenError() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(Map.class)))
                .thenThrow(new RuntimeException("Network error"));

        Map<String, Double> prices = client.getBatchPrices(List.of("AAPL"));

        assertTrue(prices.isEmpty());
    }

    @Test
    void getBatchPrices_handlesNullValues() {
        Map<String, Object> responseMap = new HashMap<>();
        Map<String, Object> innerPrices = new HashMap<>();
        innerPrices.put("AAPL", 150.0);
        innerPrices.put("MSFT", null);
        innerPrices.put("GOOGL", "invalid");
        responseMap.put("prices", innerPrices);
        ResponseEntity<Map> response = new ResponseEntity<>(responseMap, HttpStatus.OK);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(Map.class)))
                .thenReturn(response);

        Map<String, Double> result = client.getBatchPrices(List.of("AAPL", "MSFT", "GOOGL"));

        assertEquals(150.0, result.get("AAPL"));
        assertEquals(0.0, result.get("MSFT"));
        assertEquals(0.0, result.get("GOOGL"));
    }

    @Test
    void getPriceHistory_returnsHistory_whenSuccessful() {
        List<Map<String, Object>> history = List.of(
                Map.of("timestamp", "2024-01-01", "price", 150.0, "volume", 1000000),
                Map.of("timestamp", "2024-01-02", "price", 152.0, "volume", 1200000)
        );
        ResponseEntity<List> response = new ResponseEntity<>(history, HttpStatus.OK);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(List.class)))
                .thenReturn(response);

        List<com.capitalfourge.proto.PricePoint> result = client.getPriceHistory("AAPL", 30);

        assertEquals(2, result.size());
    }

    @Test
    void getPriceHistory_returnsEmptyList_whenError() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(List.class)))
                .thenThrow(new RuntimeException("Network error"));

        List<com.capitalfourge.proto.PricePoint> result = client.getPriceHistory("AAPL", 30);

        assertTrue(result.isEmpty());
    }

    @Test
    void getCategorizedAssets_returnsAssets_whenSuccessful() {
        List<Map<String, Object>> assets = List.of(
                Map.of("symbol", "AAPL", "name", "Apple", "category", "STOCKS"),
                Map.of("symbol", "BTC-USD", "name", "Bitcoin", "category", "CRYPTO")
        );
        ResponseEntity<List> response = new ResponseEntity<>(assets, HttpStatus.OK);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(List.class)))
                .thenReturn(response);

        List<com.capitalfourge.proto.Asset> result = client.getCategorizedAssets();

        assertEquals(2, result.size());
    }

    @Test
    void getCategorizedAssets_returnsEmptyList_whenError() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(List.class)))
                .thenThrow(new RuntimeException("Network error"));

        List<com.capitalfourge.proto.Asset> result = client.getCategorizedAssets();

        assertTrue(result.isEmpty());
    }

    @Test
    void getAllAvailableSymbols_returnsSymbols_whenSuccessful() {
        List<?> symbols = List.of("AAPL", "MSFT", "GOOGL");
        ResponseEntity<List> response = new ResponseEntity<>(symbols, HttpStatus.OK);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(List.class)))
                .thenReturn(response);

        List<String> result = client.getAllAvailableSymbols();

        assertEquals(3, result.size());
    }

    @Test
    void getAllAvailableSymbols_returnsEmptyList_whenError() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(List.class)))
                .thenThrow(new RuntimeException("Network error"));

        List<String> result = client.getAllAvailableSymbols();

        assertTrue(result.isEmpty());
    }

    @Test
    void searchSymbols_returnsAssets_whenSuccessful() {
        List<Map<String, Object>> assets = List.of(
                Map.of("symbol", "AAPL", "name", "Apple", "category", "STOCKS")
        );
        ResponseEntity<List> response = new ResponseEntity<>(assets, HttpStatus.OK);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(List.class)))
                .thenReturn(response);

        List<com.capitalfourge.proto.Asset> result = client.searchSymbols("Apple", 5);

        assertEquals(1, result.size());
    }

    @Test
    void searchSymbols_returnsEmptyList_whenError() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(List.class)))
                .thenThrow(new RuntimeException("Network error"));

        List<com.capitalfourge.proto.Asset> result = client.searchSymbols("Apple", 5);

        assertTrue(result.isEmpty());
    }

    @Test
    void getAssetName_returnsName_whenSuccessful() {
        Map<String, Object> responseMap = Map.of("name", "Apple Inc.");
        ResponseEntity<Map> response = new ResponseEntity<>(responseMap, HttpStatus.OK);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(Map.class)))
                .thenReturn(response);

        String name = client.getAssetName("AAPL");

        assertEquals("Apple Inc.", name);
    }

    @Test
    void getAssetName_returnsSymbol_whenError() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(Map.class)))
                .thenThrow(new RuntimeException("Network error"));

        String name = client.getAssetName("AAPL");

        assertEquals("AAPL", name);
    }

    @Test
    void headersContainApiKey() {
        Map<String, Object> prices = Map.of("prices", Map.of("AAPL", 150.0));
        ResponseEntity<Map> response = new ResponseEntity<>(prices, HttpStatus.OK);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(Map.class)))
                .thenReturn(response);

        client.getBatchPrices(List.of("AAPL"));

        verify(restTemplate).exchange(
                anyString(),
                eq(HttpMethod.GET),
                argThat(entity -> {
                    HttpHeaders headers = entity.getHeaders();
                    return "test-api-key".equals(headers.getFirst("X-API-Key"));
                }),
                eq(Map.class)
        );
    }

    @Test
    void timeoutConfiguration_isSet() {
        verify(restTemplateBuilder).setConnectTimeout(Duration.ofSeconds(10));
        verify(restTemplateBuilder).setReadTimeout(Duration.ofSeconds(60));
    }
}