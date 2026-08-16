package com.capitalfourge.portfoliomanager.domain;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
public class Feedback {
    private UUID id;
    private UUID userId;
    private String username;
    private Category category;
    private String message;
    private LocalDateTime createdAt;
    private boolean read;

    public enum Category {
        QUEJA,
        RECLAMO,
        SUGERENCIA,
        OTRO
    }
    
    // Explicit getters/setters for Lombok compatibility
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public boolean isRead() { return read; }
    public void setRead(boolean read) { this.read = read; }
    
    // Explicit all-args constructor for Lombok compatibility
    public Feedback(UUID id, UUID userId, String username, Category category,
                    String message, LocalDateTime createdAt, boolean read) {
        this.id = id;
        this.userId = userId;
        this.username = username;
        this.category = category;
        this.message = message;
        this.createdAt = createdAt;
        this.read = read;
    }
}