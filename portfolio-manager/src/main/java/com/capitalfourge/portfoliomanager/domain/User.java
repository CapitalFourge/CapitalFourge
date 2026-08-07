package com.capitalfourge.portfoliomanager.domain;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class User {

    private UUID id;
    private String email;
    private String password; // BCrypt hash, never plain text
    private String username;
    private Role role;
    private boolean active = true;
    private LocalDateTime createdAt;
    private LocalDateTime lastLoginAt;
    private String language = "ES";
    private BigDecimal cashBalance = BigDecimal.ZERO;
    private BigDecimal lockedBalance = BigDecimal.ZERO;
    private boolean showWelcome = true;
    
    // Optimistic locking
    private Long version;

    public boolean isActive() {
        return this.active;
    }

    public boolean isAdmin() {
        return this.role == Role.ADMIN;
    }

    // Password verification delegate - implemented by adapter with PasswordEncoder
    public boolean verifyPassword(String rawPassword, java.util.function.Function<String, Boolean> verifier) {
        return verifier.apply(this.password);
    }
}
