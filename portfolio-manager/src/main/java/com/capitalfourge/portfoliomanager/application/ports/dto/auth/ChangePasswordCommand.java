package com.capitalfourge.portfoliomanager.application.ports.dto.auth;

import java.util.UUID;

import lombok.Value;

@Value
public class ChangePasswordCommand {
    UUID userId;
    String currentPassword;
    String newPassword;
}
