package com.capitalfourge.portfoliomanager.domain;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
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
    
    // Explicit getters/setters for Lombok compatibility
    public BigDecimal getCashBalance() { return cashBalance; }
    public void setCashBalance(BigDecimal cashBalance) { this.cashBalance = cashBalance; }
    public BigDecimal getLockedBalance() { return lockedBalance; }
    public void setLockedBalance(BigDecimal lockedBalance) { this.lockedBalance = lockedBalance; }
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    public boolean getActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getLastLoginAt() { return lastLoginAt; }
    public void setLastLoginAt(LocalDateTime lastLoginAt) { this.lastLoginAt = lastLoginAt; }
    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }
    public boolean getShowWelcome() { return showWelcome; }
    public void setShowWelcome(boolean showWelcome) { this.showWelcome = showWelcome; }
    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }
    
    // Alias for Lombok boolean getter convention
    public boolean isShowWelcome() { return showWelcome; }
}
