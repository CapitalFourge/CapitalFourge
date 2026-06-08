package com.capitalfourge.portfoliomanager.application.ports.dto.auth;

import com.capitalfourge.portfoliomanager.domain.User;

import lombok.*;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuthResult {
    private String token;
    private String refreshToken;
    private User user;
}
