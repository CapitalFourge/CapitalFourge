package com.capitalfourge.portfoliomanager.application.ports.dto.auth;

import com.capitalfourge.portfoliomanager.domain.User;

public class AuthResult {
    private String token;
    private String refreshToken;
    private User user;

    public AuthResult() {}

    public AuthResult(String token, String refreshToken, User user) {
        this.token = token;
        this.refreshToken = refreshToken;
        this.user = user;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public String getRefreshToken() { return refreshToken; }
    public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
}
