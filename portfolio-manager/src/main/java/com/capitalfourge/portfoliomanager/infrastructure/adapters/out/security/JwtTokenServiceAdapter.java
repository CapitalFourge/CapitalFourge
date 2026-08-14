package com.capitalfourge.portfoliomanager.infrastructure.adapters.out.security;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.capitalfourge.portfoliomanager.application.ports.out.TokenService;
import com.capitalfourge.portfoliomanager.domain.User;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtTokenServiceAdapter implements TokenService {

    private final SecretKey key;
    private final String issuer;
    private final long accessExpirationMs;
    private final long refreshExpirationMs;

    public JwtTokenServiceAdapter(
            @Value("${spring.jwt.secret}") String secret,
            @Value("${spring.jwt.issuer}") String issuer,
            @Value("${spring.jwt.access-expiration-ms}") long accessExpirationMs,
            @Value("${spring.jwt.refresh-expiration-ms}") long refreshExpirationMs) {

        // P1-11: Fail fast if JWT secret < 256 bits (32 bytes)
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("JWT secret must be at least 256 bits (32 bytes)");
        }
        
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.issuer = issuer;
        this.accessExpirationMs = accessExpirationMs;
        this.refreshExpirationMs = refreshExpirationMs;
    }

    @Override
    public String createAccessToken(User user) {
        Date now = new Date();
        Date exp = new Date(now.getTime() + accessExpirationMs);

        return Jwts.builder()
                .issuer(issuer)
                .subject(user.getId().toString())
                .claim("typ", "ACCESS")
                .claim("email", user.getEmail())
                .claim("username", user.getUsername())
                .claim("role", user.getRole().name())
                .issuedAt(now)
                .expiration(exp)
                .signWith(key)
                .compact();
    }

    @Override
    public String createRefreshToken(User user) {
        Date now = new Date();
        Date exp = new Date(now.getTime() + refreshExpirationMs);

        return Jwts.builder()
                .issuer(issuer)
                .subject(user.getId().toString())
                .claim("typ", "REFRESH")
                .issuedAt(now)
                .expiration(exp)
                .signWith(key)
                .compact();
    }

    @Override
    public boolean validateRefreshToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public UUID extractUserId(String token) {
        Claims claims = parseClaims(token);
        String subject = claims.getSubject();
        if (subject == null) {
            throw new IllegalArgumentException("Token missing 'sub' claim");
        }
        return UUID.fromString(subject);
    }

    @Override
    public String extractEmail(String token) {
        Claims claims = parseClaims(token);
        String email = claims.get("email", String.class);
        if (email == null) {
            throw new IllegalArgumentException("Token missing 'email' claim");
        }
        return email;
    }

    @Override
    public String extractUsername(String token) {
        Claims claims = parseClaims(token);
        String username = claims.get("username", String.class);
        if (username == null) {
            throw new IllegalArgumentException("Token missing 'username' claim");
        }
        return username;
    }

    @Override
    public String extractRole(String token) {
        Claims claims = parseClaims(token);
        String role = claims.get("role", String.class);
        if (role == null) {
            throw new IllegalArgumentException("Token missing 'role' claim");
        }
        return role;
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
