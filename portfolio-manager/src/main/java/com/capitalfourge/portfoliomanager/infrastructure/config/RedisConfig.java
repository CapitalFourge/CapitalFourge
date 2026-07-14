package com.capitalfourge.portfoliomanager.infrastructure.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PostConstruct;

@Configuration
public class RedisConfig {

    @Value("${spring.redis.url}")
    private String redisUrl;

    @PostConstruct
    public void logRedisUrl() {
        System.out.println("[DEBUG] Spring Redis URL configured: " + redisUrl);
    }

    @Bean
    org.springframework.data.redis.connection.RedisConnectionFactory redisConnectionFactory(org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory factory) {
        return factory;
    }

    @Bean
    org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory lettuceConnectionFactory(@Value("${spring.redis.url}") String url) {
        return new org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory(url);
    }
}
