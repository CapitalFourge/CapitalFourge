package com.capitalfourge.portfoliomanager.application.ports.dto.auth;

import java.util.UUID;

import lombok.Value;

@Value
public class ChangeEmailCommand {
    UUID userId;
    String newEmail;
}
