package com.finsight.portfoliomanager.application.services;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import org.springframework.security.crypto.password.PasswordEncoder;

import com.finsight.portfoliomanager.application.ports.dto.auth.AuthResult;
import com.finsight.portfoliomanager.application.ports.dto.auth.ChangeEmailCommand;
import com.finsight.portfoliomanager.application.ports.dto.auth.ChangePasswordCommand;
import com.finsight.portfoliomanager.application.ports.dto.auth.LoginCommand;
import com.finsight.portfoliomanager.application.ports.dto.auth.RefreshCommand;
import com.finsight.portfoliomanager.application.ports.dto.auth.RegisterCommand;
import com.finsight.portfoliomanager.application.ports.in.UserUseCase;
import com.finsight.portfoliomanager.application.ports.out.TokenRepository;
import com.finsight.portfoliomanager.application.ports.out.TokenService;
import com.finsight.portfoliomanager.application.ports.out.UserRepository;
import com.finsight.portfoliomanager.domain.Role;
import com.finsight.portfoliomanager.domain.User;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService implements UserUseCase {

    private final UserRepository userRepository;
    private final TokenService tokenService;
    private final TokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;

    private static final long REFRESH_TTL_SECONDS = 60L * 60L * 24L * 7L;

    @Override
    public AuthResult register(RegisterCommand command) {
        if (userRepository.existsByEmail(command.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        User user = User.builder()
                .id(UUID.randomUUID())
                .email(command.getEmail())
                .password(passwordEncoder.encode(command.getPassword()))
                .username(command.getUsername())
                .role(Role.USER)
                .active(true)
                .createdAt(LocalDateTime.now())
                .lastLoginAt(null)
                .build();

        User saved = userRepository.save(user);

        String access = tokenService.createAccessToken(saved);
        String refresh = tokenService.createRefreshToken(saved);

        refreshTokenRepository.save(saved.getId(), refresh, REFRESH_TTL_SECONDS);

        return AuthResult.builder()
                .token(access)
                .refreshToken(refresh)
                .user(saved)
                .build();
    }

    @Override
    public AuthResult login(LoginCommand command) {
        User user = userRepository.findByEmail(command.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!user.isActive()) {
            throw new RuntimeException("Account is disabled");
        }

        if (!passwordEncoder.matches(command.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        user.setLastLoginAt(LocalDateTime.now());
        User saved = userRepository.save(user);

        String access = tokenService.createAccessToken(saved);
        String refresh = tokenService.createRefreshToken(saved);

        refreshTokenRepository.save(saved.getId(), refresh, REFRESH_TTL_SECONDS);

        return AuthResult.builder()
                .token(access)
                .refreshToken(refresh)
                .user(saved)
                .build();
    }

    @Override
    public AuthResult refresh(RefreshCommand command) {
        String refreshToken = command.getRefreshToken();

        if (!tokenService.validateRefreshToken(refreshToken)) {
            throw new RuntimeException("Invalid refresh token");
        }

        UUID userIdFromToken = tokenService.extractUserId(refreshToken);

        String stored = refreshTokenRepository.findByUserId(userIdFromToken)
                .orElseThrow(() -> new RuntimeException("Refresh token not found"));

        if (!stored.equals(refreshToken)) {
            throw new RuntimeException("Refresh token revoked");
        }

        User user = userRepository.findById(userIdFromToken)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.isActive()) {
            throw new RuntimeException("Account is disabled");
        }

        String newAccess = tokenService.createAccessToken(user);
        String newRefresh = tokenService.createRefreshToken(user);

        refreshTokenRepository.save(user.getId(), newRefresh, REFRESH_TTL_SECONDS);

        return AuthResult.builder()
                .token(newAccess)
                .refreshToken(newRefresh)
                .user(user)
                .build();
    }

    @Override
    public void logout(UUID userId) {
        refreshTokenRepository.deleteByUserId(userId);
    }

    @Override
    public Optional<User> findById(UUID userId) {
        return userRepository.findById(userId);
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Override
    public void deactivate(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setActive(false);
        userRepository.save(user);

        refreshTokenRepository.deleteByUserId(userId);
    }

    @Override
    public void changePassword(ChangePasswordCommand command) {
        User user = userRepository.findById(command.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(command.getCurrentPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid current password");
        }

        user.setPassword(passwordEncoder.encode(command.getNewPassword()));
        userRepository.save(user);

        refreshTokenRepository.deleteByUserId(user.getId());
    }

    @Override
    public void changeEmail(ChangeEmailCommand command) {
        if (userRepository.existsByEmail(command.getNewEmail())) {
            throw new RuntimeException("Email already in use");
        }

        User user = userRepository.findById(command.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setEmail(command.getNewEmail());
        userRepository.save(user);
    }

}
