package com.capitalfourge.portfoliomanager.infrastructure.adapters.in.rest;

import io.github.bucket4j.Bucket;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
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

    @PostMapping("/register")
    public AuthResult register(@Valid @RequestBody RegisterCommand command) {
        log.info("POST /api/auth/register - email: {}", command.getEmail());
        return userUseCase.register(command);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResult> login(@Valid @RequestBody LoginCommand command, HttpServletRequest request) {
        String clientIp = getClientIp(request);
        
        // Rate limit: 5 requests per minute per IP
        if (!loginBucket.tryConsume(1)) {
            log.warn("Rate limit exceeded for login from IP: {}", clientIp);
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Too many login attempts. Please try again later.");
        }

        log.info("POST /api/auth/login - email: {}, ip: {}", command.getEmail(), clientIp);
        AuthResult result = userUseCase.login(command);
        log.info("POST /api/auth/login - success: {}", result != null);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/refresh")
    public AuthResult refresh(@Valid @RequestBody RefreshCommand command) {
        log.info("POST /api/auth/refresh");
        return userUseCase.refresh(command);
    }

    @PostMapping("/logout/{userId}")
    public void logout(@PathVariable UUID userId) {
        log.info("POST /api/auth/logout - userId: {}", userId);
        userUseCase.logout(userId);
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
}
