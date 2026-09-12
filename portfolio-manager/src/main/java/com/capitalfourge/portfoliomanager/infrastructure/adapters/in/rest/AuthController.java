package com.capitalfourge.portfoliomanager.infrastructure.adapters.in.rest;

import io.github.bucket4j.Bucket;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.capitalfourge.portfoliomanager.application.ports.dto.auth.AuthResult;
import com.capitalfourge.portfoliomanager.application.ports.dto.auth.LoginCommand;
import com.capitalfourge.portfoliomanager.application.ports.dto.auth.RefreshCommand;
import com.capitalfourge.portfoliomanager.application.ports.dto.auth.RegisterCommand;
import com.capitalfourge.portfoliomanager.application.ports.in.UserUseCase;
import com.capitalfourge.portfoliomanager.infrastructure.config.RateLimitConfig;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);
    private final UserUseCase userUseCase;
    private final Bucket loginBucket;

    private static final String REFRESH_COOKIE_NAME = "refresh_token";
    private static final String ACCESS_COOKIE_NAME = "access_token";
    private static final int REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds
    private static final int ACCESS_COOKIE_MAX_AGE = 60 * 60 * 24; // 24 hours in seconds

    @PostMapping("/register")
    public AuthResult register(@Valid @RequestBody RegisterCommand command) {
        log.info("POST /api/auth/register - email: {}", command.getEmail());
        return userUseCase.register(command);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResult> login(@Valid @RequestBody LoginCommand command, 
                                             HttpServletRequest request,
                                             HttpServletResponse response) {
        String clientIp = getClientIp(request);
        
        // Rate limit: 5 requests per minute per IP
        if (!loginBucket.tryConsume(1)) {
            log.warn("Rate limit exceeded for login from IP: {}", clientIp);
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Too many login attempts. Please try again later.");
        }

        log.info("POST /api/auth/login - email: {}, ip: {}", command.getEmail(), clientIp);
        AuthResult result = userUseCase.login(command);
        log.info("POST /api/auth/login - success: {}", result != null);
        
        // Set refresh token as httpOnly cookie
                if (result != null && result.getRefreshToken() != null) {
                    setRefreshTokenCookie(response, result.getRefreshToken());
                }
        
                // Set access token as httpOnly cookie (for GraphQL cross-origin auth)
                if (result != null && result.getToken() != null) {
                    setAccessTokenCookie(response, result.getToken());
                }

                // Return auth result without refresh token in body (it's in cookie)
                return ResponseEntity.ok(new AuthResult(result.getToken(), null, result.getUser()));
    }

    @PostMapping("/refresh")
        public AuthResult refresh(HttpServletRequest request,
                                   HttpServletResponse response,
                                   @RequestBody(required = false) RefreshCommand command) {
            log.info("POST /api/auth/refresh");

            // Try to get refresh token from cookie first, then from body (backward compatibility)
            String refreshToken = getRefreshTokenFromCookie(request);
            if (refreshToken == null && command != null) {
                refreshToken = command.getRefreshToken();
            }

            if (refreshToken == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Refresh token not found");
            }

            AuthResult result = userUseCase.refresh(new RefreshCommand(null, refreshToken));

            // Set new refresh token as httpOnly cookie
            if (result != null && result.getRefreshToken() != null) {
                setRefreshTokenCookie(response, result.getRefreshToken());
            }
        
            // Set new access token as httpOnly cookie
            if (result != null && result.getToken() != null) {
                setAccessTokenCookie(response, result.getToken());
            }

            // Return auth result without refresh token in body
            return new AuthResult(result.getToken(), null, result.getUser());
        }

    @PostMapping("/logout/{userId}")
    public void logout(@PathVariable UUID userId, HttpServletResponse response) {
        log.info("POST /api/auth/logout - userId: {}", userId);
        userUseCase.logout(userId);
        // Clear refresh token cookie
        clearRefreshTokenCookie(response);
        // Clear access token cookie
        clearAccessTokenCookie(response);
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }

    private void setRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE_NAME, refreshToken)
                .httpOnly(true)
                .secure(true) // Only over HTTPS in production
                .sameSite("Lax")
                .path("/")
                .maxAge(REFRESH_COOKIE_MAX_AGE)
                .build();
        response.addHeader("Set-Cookie", cookie.toString());
    }

    private void clearRefreshTokenCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(true)
                .sameSite("Lax")
                .path("/")
                .maxAge(0)
                .build();
        response.addHeader("Set-Cookie", cookie.toString());
    }

    private void setAccessTokenCookie(HttpServletResponse response, String accessToken) {
        ResponseCookie cookie = ResponseCookie.from(ACCESS_COOKIE_NAME, accessToken)
                .httpOnly(true)
                .secure(true)
                .sameSite("Lax")
                .path("/")
                .maxAge(ACCESS_COOKIE_MAX_AGE)
                .build();
        response.addHeader("Set-Cookie", cookie.toString());
    }

    private void clearAccessTokenCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(ACCESS_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(true)
                .sameSite("Lax")
                .path("/")
                .maxAge(0)
                .build();
        response.addHeader("Set-Cookie", cookie.toString());
    }

    private String getRefreshTokenFromCookie(HttpServletRequest request) {
        if (request.getCookies() == null) return null;
        for (jakarta.servlet.http.Cookie cookie : request.getCookies()) {
            if (REFRESH_COOKIE_NAME.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }
}
