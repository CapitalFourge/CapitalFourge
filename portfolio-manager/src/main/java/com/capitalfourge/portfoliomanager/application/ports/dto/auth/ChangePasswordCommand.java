package com.capitalfourge.portfoliomanager.application.ports.dto.auth;

import jakarta.validation.constraints.*;
import java.util.UUID;
import lombok.Value;

@Value
public class ChangePasswordCommand {

    UUID userId;

    @NotBlank(message = "Current password is required")
    String currentPassword;

    @NotBlank(message = "New password is required")
    @Size(min = 8, max = 128, message = "Password must be between 8 and 128 characters")
    String newPassword;
}
