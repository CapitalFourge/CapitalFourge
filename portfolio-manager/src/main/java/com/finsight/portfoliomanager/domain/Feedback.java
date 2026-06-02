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
public class Feedback {

    public enum Category {
        QUEJA,
        RECLAMO,
        SUGERENCIA,
        OTRO
    }

    private UUID id;
    private UUID userId;
    private String username;
    private Category category;
    private String message;
    private LocalDateTime createdAt;
    private boolean read;
}
