package com.capitalfourge.portfoliomanager.infrastructure.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class RestClientConfig {

    @Bean(name = "dataCollectorClient")
    public RestClient dataCollectorClient(@Value("${data-collector.base-url:http://localhost:8081}") String baseUrl,
                                           @Value("${data-collector.api-key:internal-service-key}") String apiKey) {
        return RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader("Accept", "application/json")
                .defaultHeader("X-API-Key", apiKey)
                .build();
    }
}