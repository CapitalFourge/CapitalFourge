package com.capitalfourge.portfoliomanager;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.data.redis.RedisReactiveHealthIndicatorAutoConfiguration;
import org.springframework.context.annotation.Bean;

import com.capitalfourge.portfoliomanager.infrastructure.grpc.GrpcFinancialDataClient;

@SpringBootApplication(exclude = {RedisReactiveHealthIndicatorAutoConfiguration.class})
public class PortfolioManagerApplication {

    public static void main(String[] args) {
        SpringApplication.run(PortfolioManagerApplication.class, args);
    }

    @Bean
    CommandLineRunner testBatchGrpc(GrpcFinancialDataClient grpcClient) {
        return args -> {
            System.out.println("------------------------------------------------");
            System.out.println("🧪 Probando Batch prices");
            System.out.println("------------------------------------------------");

            var symbols = List.of("AAPL", "MSFT", "GOOGL", "BTC-USD");
            var prices = grpcClient.getBatchPrices(symbols);

            prices.forEach((symbol, price) -> System.out.println("✅ " + symbol + ": " + price));

            System.out.println("------------------------------------------------");
        };
    }

    @Bean
    CommandLineRunner logRedisConfig(@Value("${spring.redis.url:NOT_SET}") String redisUrl,
                                      @Value("${spring.redis.ssl.enabled:false}") boolean sslEnabled) {
        return args -> {
            System.out.println("================================================");
            System.out.println("🔴 REDIS CONFIG:");
            System.out.println("   spring.redis.url = " + redisUrl);
            System.out.println("   spring.redis.ssl.enabled = " + sslEnabled);
            System.out.println("================================================");
        };
    }
}