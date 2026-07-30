package com.capitalfourge.portfoliomanager.application.ports.dto.auth;

import jakarta.validation.constraints.*;
import java.util.UUID;
import lombok.Value;

@Value
public class RefreshCommand {

    UUID userId;

    @NotBlank(message = "Refresh token is required")
    String refreshToken;
}