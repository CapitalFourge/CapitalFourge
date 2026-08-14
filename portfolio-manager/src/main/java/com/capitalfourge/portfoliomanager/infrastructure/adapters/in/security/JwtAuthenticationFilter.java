package com.capitalfourge.portfoliomanager.infrastructure.adapters.in.security;

import com.capitalfourge.portfoliomanager.infrastructure.security.UserPrincipal;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Value("${spring.jwt.secret}")
    String jwtSecret;

    private SecretKey key;

    public JwtAuthenticationFilter() {
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws IOException, ServletException {

        // ✅ Skip OPTIONS (preflight CORS) - FIRST LINE
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        // ✅ Lazy initialization of the key with validation
        if (this.key == null) {
            byte[] secretBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
            // P1-11: Fail fast if JWT secret < 256 bits (32 bytes)
            if (secretBytes.length < 32) {
                throw new IllegalStateException("JWT secret must be at least 256 bits (32 characters) for HS256");
            }
            this.key = Keys.hmacShaKeyFor(secretBytes);
        }

        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);

            try {
                Claims claims = Jwts.parser()
                        .verifyWith(key)
                        .build()
                        .parseSignedClaims(token)
                        .getPayload();

                // P1-12: Null checks for required claims
                String subject = claims.getSubject();
                if (subject == null || subject.isEmpty()) {
                    filterChain.doFilter(request, response);
                    return;
                }

                String type = (String) claims.get("typ");
                if (!"ACCESS".equals(type)) {
                    filterChain.doFilter(request, response);
                    return;
                }

                UUID userId = UUID.fromString(subject);
                String role = (String) claims.get("role");
                String email = (String) claims.get("email");
                String username = (String) claims.get("username");

                // Create UserPrincipal with full user info
                UserPrincipal principal = new UserPrincipal(userId, username, email);

                var auth = new UsernamePasswordAuthenticationToken(
                        principal,
                        null,
                        role == null
                                ? List.of()
                                : List.of(new SimpleGrantedAuthority("ROLE_" + role)));

                SecurityContextHolder.getContext().setAuthentication(auth);

            } catch (Exception e) {
                // Log the exception but don't fail the request - let it proceed unauthenticated
                // The secured endpoints will reject it
            }
        }

        filterChain.doFilter(request, response);
    }
}