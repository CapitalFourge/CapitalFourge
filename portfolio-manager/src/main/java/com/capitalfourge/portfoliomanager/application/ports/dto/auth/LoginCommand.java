package com.capitalfourge.portfoliomanager.application.ports.dto.auth;

import jakarta.validation.constraints.*;
import lombok.Value;

@Value
public class LoginCommand {

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 128, message = "Password must be between 8 and 128 characters")
    String password;
}
