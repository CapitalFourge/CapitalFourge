package com.capitalfourge.portfoliomanager.domain;

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
}