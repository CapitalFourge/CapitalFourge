package com.capitalfourge.portfoliomanager.application.ports.dto.auth;

import jakarta.validation.constraints.*;
import java.util.UUID;

public class ChangeEmailCommand {

    private UUID userId;

    @NotBlank(message = "New email is required")
    @Email(message = "Invalid email format")
    private String newEmail;

    public ChangeEmailCommand() {}

    public ChangeEmailCommand(UUID userId, String newEmail) {
        this.userId = userId;
        this.newEmail = newEmail;
    }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public String getNewEmail() { return newEmail; }
    public void setNewEmail(String newEmail) { this.newEmail = newEmail; }
}
