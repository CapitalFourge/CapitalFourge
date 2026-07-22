package com.capitalfourge.portfoliomanager.infrastructure.adapters.in.rest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.boot.actuate.health.Status;
import org.springframework.context.annotation.Profile;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import jakarta.annotation.PostConstruct;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import org.springframework.http.client.SimpleClientHttpRequestFactory;

@RestController
@RequestMapping("/api/health")
public class HealthCheckController {

    @Autowired
    private RedisConnectionFactory redisConnectionFactory;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Value("${spring.data-collector.base-url:http://data-collector:8000}")
    private String dataCollectorBaseUrl;

    @Value("${spring.data-collector.api-key:internal-service-key}")
    private String dataCollectorApiKey;

    private RestClient restClient;

    @PostConstruct
    public void init() {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(3));
        requestFactory.setReadTimeout(Duration.ofSeconds(5));

        this.restClient = RestClient.builder()
                .defaultHeader("X-API-Key", dataCollectorApiKey)
                .requestFactory(requestFactory)
                .build();
    }

    @GetMapping("/liveness")
    public ResponseEntity<Map<String, Object>> liveness() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("timestamp", Instant.now().toString());
        response.put("check", "liveness");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/readiness")
    public ResponseEntity<Map<String, Object>> readiness() {
        Map<String, Object> response = new HashMap<>();
        Map<String, Object> checks = new HashMap<>();
        boolean allHealthy = true;

        // Check Database
        Map<String, Object> dbCheck = new HashMap<>();
        try {
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            dbCheck.put("status", "UP");
            dbCheck.put("details", "Database connection successful");
        } catch (Exception e) {
            dbCheck.put("status", "DOWN");
            dbCheck.put("details", "Database connection failed: " + e.getMessage());
            allHealthy = false;
        }
        checks.put("database", dbCheck);

        // Check Redis (Upstash)
        Map<String, Object> redisCheck = new HashMap<>();
        try {
            var connection = redisConnectionFactory.getConnection();
            connection.ping();
            connection.close();
            redisCheck.put("status", "UP");
            redisCheck.put("details", "Redis connection successful");
        } catch (Exception e) {
            redisCheck.put("status", "DOWN");
            redisCheck.put("details", "Redis connection failed: " + e.getMessage());
            allHealthy = false;
        }
        checks.put("redis", redisCheck);

        // Check Data Collector
        Map<String, Object> dcCheck = new HashMap<>();
        try {
            var dcResponse = restClient.get()
                    .uri(dataCollectorBaseUrl + "/health")
                    .retrieve()
                    .toEntity(Map.class);
            if (dcResponse.getStatusCode().is2xxSuccessful() && "alive".equals(dcResponse.getBody().get("status"))) {
                dcCheck.put("status", "UP");
                dcCheck.put("details", "Data Collector is healthy");
            } else {
                dcCheck.put("status", "DOWN");
                dcCheck.put("details", "Data Collector returned non-OK status");
                allHealthy = false;
            }
        } catch (RestClientException e) {
            dcCheck.put("status", "DOWN");
            dcCheck.put("details", "Data Collector unreachable: " + e.getMessage());
            allHealthy = false;
        }
        checks.put("data-collector", dcCheck);

        response.put("status", allHealthy ? "UP" : "DOWN");
        response.put("timestamp", Instant.now().toString());
        response.put("checks", checks);

        return allHealthy ? ResponseEntity.ok(response) : ResponseEntity.status(503).body(response);
    }

    @GetMapping("/startup")
    public ResponseEntity<Map<String, Object>> startup() {
        // Startup probe - same as readiness but can be more lenient during startup
        return readiness();
    }
}