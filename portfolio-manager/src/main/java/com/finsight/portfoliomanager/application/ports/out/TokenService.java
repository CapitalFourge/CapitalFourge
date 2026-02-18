package com.finsight.portfoliomanager.application.ports.out;

import java.util.UUID;

import com.finsight.portfoliomanager.domain.User;

public interface TokenService {

    String createAccessToken(User user);

    String createRefreshToken(User user);

    boolean validateRefreshToken(String token);

    UUID extractUserId(String token);
}
