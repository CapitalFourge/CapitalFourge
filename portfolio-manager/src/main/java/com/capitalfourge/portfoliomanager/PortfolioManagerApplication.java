package com.capitalfourge.portfoliomanager;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import com.capitalfourge.portfoliomanager.infrastructure.grpc.GrpcFinancialDataClient;

@SpringBootApplication
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
    CommandLineRunner logRedisUrl(@Value("${spring.redis.url:NOT_SET}") String redisUrl) {
        return args -> {
            System.out.println("================================================");
            System.out.println("🔴 SPRING_REDIS_URL leída por Spring: " + redisUrl);
            System.out.println("================================================");
        };
    }
}