package com.capitalfourge.portfoliomanager.infrastructure.adapters.out.datacollector;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;

@Component
public class DataCollectorClientImpl implements DataCollectorClient {

    private final RestClient dataCollectorClient;

    @Autowired
    public DataCollectorClientImpl(@Qualifier("dataCollectorClient") RestClient dataCollectorClient) {
        this.dataCollectorClient = dataCollectorClient;
    }

    @Override
    public List<AssetDTO> getAssetsByCategory(String category) {
        try {
            return dataCollectorClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/assets/categorized")
                            .queryParam("category", category)
                            .build())
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<AssetDTO>>() {});
        } catch (Exception e) {
            return List.of();
        }
    }

    @Override
    public List<AssetDTO> searchSymbols(String query, int limit) {
        try {
            return dataCollectorClient.post()
                    .uri("/assets/search")
                    .body(new SearchRequest(query, limit))
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<AssetDTO>>() {});
        } catch (Exception e) {
            return List.of();
        }
    }

    private record SearchRequest(String query, int limit) {}
}