package com.capitalfourge.portfoliomanager.application.ports.dto.auth;

import jakarta.validation.constraints.*;
import java.util.UUID;

public class RefreshCommand {

    private UUID userId;

    @NotBlank(message = "Refresh token is required")
    private String refreshToken;

    public RefreshCommand() {}

    public RefreshCommand(UUID userId, String refreshToken) {
        this.userId = userId;
        this.refreshToken = refreshToken;
    }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public String getRefreshToken() { return refreshToken; }
    public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }
}