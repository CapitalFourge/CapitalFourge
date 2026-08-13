package com.capitalfourge.portfoliomanager.infrastructure.adapters.in.rest;

import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.capitalfourge.portfoliomanager.application.ports.in.UserUseCase;
import com.capitalfourge.portfoliomanager.domain.User;
import com.capitalfourge.portfoliomanager.infrastructure.security.UserPrincipal;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private static final Logger log = LoggerFactory.getLogger(UserController.class);
    private final UserUseCase userUseCase;

    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal().equals("anonymousUser")) {
            log.warn("GET /api/users/me - no authenticated user");
            return ResponseEntity.status(401).build();
        }

        // Principal is UserPrincipal from JwtAuthenticationFilter
        UUID userId = null;
        if (auth.getPrincipal() instanceof UserPrincipal principal) {
            userId = principal.userId();
        } else {
            log.warn("GET /api/users/me - principal is not UserPrincipal: {}", auth.getPrincipal().getClass());
            return ResponseEntity.status(401).build();
        }
        
        log.info("GET /api/users/me - userId: {}", userId);

        return userUseCase.findById(userId)
                .map(user -> ResponseEntity.ok(user))
                .orElse(ResponseEntity.notFound().build());
    }
}