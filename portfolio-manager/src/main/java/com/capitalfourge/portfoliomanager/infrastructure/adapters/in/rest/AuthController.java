package com.capitalfourge.portfoliomanager.infrastructure.adapters.in.rest;

import java.util.UUID;

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

    private final UserUseCase userUseCase;

    @PostMapping("/register")
    public AuthResult register(@RequestBody RegisterCommand command) {
        return userUseCase.register(command);
    }

    @PostMapping("/login")
    public AuthResult login(@RequestBody LoginCommand command) {
        return userUseCase.login(command);
    }

    @PostMapping("/refresh")
    public AuthResult refresh(@RequestBody RefreshCommand command) {
        return userUseCase.refresh(command);
    }

    @PostMapping("/logout/{userId}")
    public void logout(@PathVariable UUID userId) {
        userUseCase.logout(userId);
    }
}
