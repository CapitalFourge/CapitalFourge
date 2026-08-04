package com.capitalfourge.portfoliomanager.infrastructure.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.client.RestTemplate;

import javax.sql.DataSource;
import java.time.Duration;

@Configuration
public class HealthConfig {

    @Bean
    public RestTemplate restTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(2000);
        factory.setReadTimeout(3000);
        return new RestTemplate(factory);
    }

    @Bean
    @ConditionalOnProperty(name = "spring.data-collector.health-check.enabled", havingValue = "true", matchIfMissing = false)
    public HealthIndicator dataCollectorHealthIndicator(
            @Value("${spring.data-collector.base-url}") String baseUrl,
            @Value("${spring.data-collector.api-key}") String apiKey,
            RestTemplate restTemplate) {
        restTemplate.getInterceptors().add((request, body, execution) -> {
            request.getHeaders().add("X-API-Key", apiKey);
            return execution.execute(request, body);
        });

        return () -> {
            try {
                String url = baseUrl + "/health";
                var response = restTemplate.getForEntity(url, String.class);
                if (response.getStatusCode().is2xxSuccessful()) {
                    return Health.up()
                            .withDetail("service", "data-collector")
                            .withDetail("url", url)
                            .withDetail("status", "UP")
                            .build();
                }
            } catch (Exception e) {
                // ignore, will return DOWN
            }
            return Health.down()
                    .withDetail("service", "data-collector")
                    .withDetail("url", baseUrl + "/health")
                    .withDetail("error", "Connection failed or timeout")
                    .build();
        };
    }

    @Bean
    public HealthIndicator databaseHealthIndicator(DataSource dataSource) {
        JdbcTemplate jdbcTemplate = new JdbcTemplate(dataSource);
        // P2-17: Increase timeout from 3s to 15s for transient DB slowness
        jdbcTemplate.setQueryTimeout(15);

        return () -> {
            try {
                Integer result = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
                if (result != null && result == 1) {
                    return Health.up()
                            .withDetail("database", "PostgreSQL")
                            .withDetail("status", "UP")
                            .build();
                }
            } catch (Exception e) {
                // ignore, will return DOWN
            }
            return Health.down()
                    .withDetail("database", "PostgreSQL")
                    .withDetail("error", "Connection failed")
                    .build();
        };
    }

    @Bean
    public HealthIndicator redisHealthIndicator(RedisConnectionFactory redisConnectionFactory) {
        return () -> {
            try {
                var connection = redisConnectionFactory.getConnection();
                try {
                    String pong = connection.ping();
                    if ("PONG".equalsIgnoreCase(pong)) {
                        return Health.up()
                                .withDetail("redis", "Upstash/Redis")
                                .withDetail("status", "UP")
                                .build();
                    }
                } finally {
                    connection.close();
                }
            } catch (Exception e) {
                // ignore, will return DOWN
            }
            return Health.down()
                    .withDetail("redis", "Upstash/Redis")
                    .withDetail("error", "Connection failed")
                    .build();
        };
    }

    @Bean
    @ConditionalOnProperty(name = "spring.data-collector.health-check.enabled", havingValue = "true", matchIfMissing = false)
    public HealthIndicator cacheMetricsHealthIndicator() {
        return () -> Health.down()
                .withDetail("cache", "Caffeine (price cache)")
                .withDetail("error", "gRPC client removed")
                .build();
    }
}