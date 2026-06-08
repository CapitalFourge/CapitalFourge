package com.capitalfourge.portfoliomanager.application.ports.out;

import java.util.Optional;
import java.util.UUID;

public interface TokenRepository {
    void save(UUID userId, String refreshToken, long ttlSeconds);

    Optional<String> findByUserId(UUID userId);

    void deleteByUserId(UUID userId);
}
