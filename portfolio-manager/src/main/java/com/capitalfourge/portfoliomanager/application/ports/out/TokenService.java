package com.capitalfourge.portfoliomanager.application.ports.out;

import java.util.UUID;

import com.capitalfourge.portfoliomanager.domain.User;

public interface TokenService {

    String createAccessToken(User user);

    String createRefreshToken(User user);

    boolean validateRefreshToken(String token);

    UUID extractUserId(String token);
}
