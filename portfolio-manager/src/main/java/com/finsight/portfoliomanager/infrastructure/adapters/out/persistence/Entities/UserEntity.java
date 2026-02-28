package com.finsight.portfoliomanager.infrastructure.adapters.out.persistence.Entities;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import com.finsight.portfoliomanager.domain.Role;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserEntity {
    @Id
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
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

    @Column(name = "cash_balance")
    private BigDecimal cashBalance;

    @Column(name = "locked_balance")
    private BigDecimal lockedBalance;

    private LocalDateTime lastLoginAt;

    @Column(name = "language", length = 2, nullable = false)
    @Builder.Default
    private String language = "ES";
}
