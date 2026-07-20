package com.capitalfourge.portfoliomanager.infrastructure.config;

import org.apache.commons.pool2.impl.GenericObjectPoolConfig;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceClientConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.connection.lettuce.LettucePoolingClientConfiguration;
import org.springframework.data.redis.core.RedisTemplate;

import java.time.Duration;

@Configuration
public class RedisConfig {

    @Value("${spring.redis.url}")
    private String redisUrl;

    @Value("${spring.redis.ssl.enabled:true}")
    private boolean sslEnabled;

    @Value("${spring.redis.lettuce.pool.max-active:8}")
    private int maxActive;

    @Value("${spring.redis.lettuce.pool.max-idle:8}")
    private int maxIdle;

    @Value("${spring.redis.lettuce.pool.min-idle:0}")
    private int minIdle;

    @Bean
    public RedisConnectionFactory redisConnectionFactory() {
        RedisStandaloneConfiguration redisConfig = parseRedisUrl(redisUrl);

        GenericObjectPoolConfig<Object> poolConfig = new GenericObjectPoolConfig<>();
        poolConfig.setMaxTotal(maxActive);
        poolConfig.setMaxIdle(maxIdle);
        poolConfig.setMinIdle(minIdle);

        LettuceClientConfiguration clientConfig;

        if (sslEnabled && redisUrl.startsWith("rediss://")) {
            // Configure SSL for Upstash (disable peer verification for self-signed certificates)
            clientConfig = LettucePoolingClientConfiguration.builder()
                .poolConfig(poolConfig)
                .useSsl().disablePeerVerification()
                .and()
                .commandTimeout(Duration.ofSeconds(10))
                .build();
        } else {
            clientConfig = LettucePoolingClientConfiguration.builder()
                .poolConfig(poolConfig)
                .commandTimeout(Duration.ofSeconds(10))
                .build();
        }

        return new LettuceConnectionFactory(redisConfig, clientConfig);
    }

    private RedisStandaloneConfiguration parseRedisUrl(String url) {
        // Format: redis://[:password@]host[:port] or rediss://[:password@]host[:port]
        String[] parts = url.split("://", 2);
        if (parts.length != 2) {
            throw new IllegalArgumentException("Invalid Redis URL format: " + url);
        }

        String rest = parts[1];
        String password = null;
        String host = null;
        int port = 6379;

        // Check for password
        if (rest.contains("@")) {
            String[] authAndHost = rest.split("@", 2);
            if (authAndHost[0].startsWith(":")) {
                password = authAndHost[0].substring(1);
            }
            rest = authAndHost[1];
        }

        // Extract host and port
        if (rest.contains(":")) {
            String[] hostPort = rest.split(":", 2);
            host = hostPort[0];
            try {
                port = Integer.parseInt(hostPort[1]);
            } catch (NumberFormatException e) {
                port = 6379;
            }
        } else {
            host = rest;
        }

        RedisStandaloneConfiguration config = new RedisStandaloneConfiguration(host, port);
        if (password != null) {
            config.setPassword(password);
        }

        return config;
    }

    @Bean
    public RedisTemplate<String, String> redisTemplate(RedisConnectionFactory factory) {
        RedisTemplate<String, String> template = new RedisTemplate<>();
        template.setConnectionFactory(factory);
        template.setKeySerializer(new org.springframework.data.redis.serializer.StringRedisSerializer());
        template.setValueSerializer(new org.springframework.data.redis.serializer.StringRedisSerializer());
        template.afterPropertiesSet();
        return template;
    }
}