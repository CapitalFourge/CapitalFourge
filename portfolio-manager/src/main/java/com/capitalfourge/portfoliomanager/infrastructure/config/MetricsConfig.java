package com.capitalfourge.portfoliomanager.infrastructure.config;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.binder.MeterBinder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.capitalfourge.portfoliomanager.infrastructure.grpc.GrpcFinancialDataClient;

@Configuration
public class MetricsConfig {

    @Bean
    public MeterBinder cacheMetricsBinder(GrpcFinancialDataClient client) {
        return (MeterRegistry registry) -> {
            registry.gauge("price.cache.size", client, c -> c.getCacheMetrics().estimatedSize());
            registry.gauge("price.cache.hit.rate", client, c -> c.getCacheMetrics().hitRate());
            registry.gauge("price.cache.hits", client, c -> c.getCacheMetrics().hitCount());
            registry.gauge("price.cache.misses", client, c -> c.getCacheMetrics().missCount());
            registry.gauge("price.cache.evictions", client, c -> c.getCacheMetrics().evictionCount());
            registry.gauge("price.cache.load.success", client, c -> c.getCacheMetrics().loadSuccessCount());
            registry.gauge("price.cache.load.errors", client, c -> c.getCacheMetrics().loadFailureCount());
        };
    }
}