package com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence.Entities;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import com.capitalfourge.portfoliomanager.domain.Role;

import jakarta.persistence.*;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Version;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "users")
@Getter
@Setter
public class UserEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false, length = 255) // BCrypt hash length
    private String password;

    @Column(nullable = false)
    private String username;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column(nullable = false)
    private boolean active;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "cash_balance", precision = 20, scale = 8)
    private BigDecimal cashBalance;

    @Column(name = "locked_balance", precision = 20, scale = 8)
    private BigDecimal lockedBalance;

    private LocalDateTime lastLoginAt;

    @Column(name = "language", length = 2, nullable = false)
        private String language = "ES";

    @Column(name = "show_welcome", nullable = false)
        private boolean showWelcome = true;

    @Version
        @Column(nullable = false, columnDefinition = "BIGINT DEFAULT 0")
    private Long version = 0L;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    @PostLoad
    protected void onLoad() {
        if (version == null) {
            version = 0L;
        }
    }
    
    // Explicit getters/setters for Lombok compatibility
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
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public BigDecimal getCashBalance() { return cashBalance; }
    public void setCashBalance(BigDecimal cashBalance) { this.cashBalance = cashBalance; }
    public BigDecimal getLockedBalance() { return lockedBalance; }
    public void setLockedBalance(BigDecimal lockedBalance) { this.lockedBalance = lockedBalance; }
    public LocalDateTime getLastLoginAt() { return lastLoginAt; }
    public void setLastLoginAt(LocalDateTime lastLoginAt) { this.lastLoginAt = lastLoginAt; }
    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }
    public boolean isShowWelcome() { return showWelcome; }
    public void setShowWelcome(boolean showWelcome) { this.showWelcome = showWelcome; }
    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }
    
    // Explicit no-args constructor for Lombok compatibility
    public UserEntity() {}
    
    // Explicit all-args constructor for Lombok compatibility
    public UserEntity(UUID id, String email, String password, String username, Role role,
                      boolean active, LocalDateTime createdAt, BigDecimal cashBalance,
                      BigDecimal lockedBalance, LocalDateTime lastLoginAt, String language,
                      boolean showWelcome, Long version) {
        this.id = id;
        this.email = email;
        this.password = password;
        this.username = username;
        this.role = role;
        this.active = active;
        this.createdAt = createdAt;
        this.cashBalance = cashBalance;
        this.lockedBalance = lockedBalance;
        this.lastLoginAt = lastLoginAt;
        this.language = language;
        this.showWelcome = showWelcome;
        this.version = version;
    }
}
