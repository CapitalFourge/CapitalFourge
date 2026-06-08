package com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence;

import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import com.capitalfourge.portfoliomanager.application.ports.out.TokenRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class RedisTokenAdapter implements TokenRepository {

    private final RedisTemplate<String, String> redisTemplate;
    private static final String KEY_PREFIX = "auth:refresh:";

    @Override
    public void save(UUID userId, String refreshToken, long ttlSeconds) {
        String key = KEY_PREFIX + userId;
        redisTemplate.opsForValue().set(key, refreshToken, ttlSeconds, TimeUnit.SECONDS);
    }

    @Override
    public Optional<String> findByUserId(UUID userId) {
        String key = KEY_PREFIX + userId;
        String value = redisTemplate.opsForValue().get(key);
        return Optional.ofNullable(value);
    }

    @Override
    public void deleteByUserId(UUID userId) {
        String key = KEY_PREFIX + userId;
        redisTemplate.delete(key);
    }
}
