package com.capitalfourge.portfoliomanager.application.ports.dto.auth;

import jakarta.validation.constraints.*;
import java.util.UUID;
import lombok.Value;

@Value
public class ChangeEmailCommand {

    UUID userId;

    @NotBlank(message = "New email is required")
    @Email(message = "Invalid email format")
    String newEmail;
}
