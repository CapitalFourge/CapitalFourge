package com.capitalfourge.portfoliomanager.infrastructure.adapters.in.rest;

import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.capitalfourge.portfoliomanager.application.ports.dto.auth.AuthResult;
import com.capitalfourge.portfoliomanager.application.ports.dto.auth.LoginCommand;
import com.capitalfourge.portfoliomanager.application.ports.dto.auth.RefreshCommand;
import com.capitalfourge.portfoliomanager.application.ports.dto.auth.RegisterCommand;
import com.capitalfourge.portfoliomanager.application.ports.in.UserUseCase;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);
    private final UserUseCase userUseCase;

    @PostMapping("/register")
    public AuthResult register(@RequestBody RegisterCommand command) {
        log.info("POST /api/auth/register - email: {}", command.getEmail());
        return userUseCase.register(command);
    }

    @PostMapping("/login")
    public AuthResult login(@RequestBody LoginCommand command) {
        log.info("POST /api/auth/login - email: {}", command.getEmail());
        AuthResult result = userUseCase.login(command);
        log.info("POST /api/auth/login - success: {}", result != null);
        return result;
    }

    @PostMapping("/refresh")
    public AuthResult refresh(@RequestBody RefreshCommand command) {
        log.info("POST /api/auth/refresh");
        return userUseCase.refresh(command);
    }

    @PostMapping("/logout/{userId}")
    public void logout(@PathVariable UUID userId) {
        log.info("POST /api/auth/logout - userId: {}", userId);
        userUseCase.logout(userId);
    }
}
