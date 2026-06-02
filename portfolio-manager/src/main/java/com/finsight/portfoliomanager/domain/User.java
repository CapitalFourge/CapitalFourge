package com.finsight.portfoliomanager.domain;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    private UUID id;
    private String email;
    private String password;
    private String username;
    private Role role;
    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime lastLoginAt;
    @Builder.Default
    private String language = "ES";
    @Builder.Default
    private BigDecimal cashBalance = BigDecimal.ZERO;
    @Builder.Default
    private BigDecimal lockedBalance = BigDecimal.ZERO;
    @Builder.Default
    private boolean showWelcome = true;

    public boolean isActive() {
        return this.active;
    }

    public boolean isAdmin() {
        return this.role == Role.ADMIN;
    }
}
