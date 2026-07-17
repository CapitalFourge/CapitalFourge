package com.capitalfourge.portfoliomanager.application.services;

import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.security.crypto.password.PasswordEncoder;

import com.capitalfourge.portfoliomanager.application.ports.dto.auth.AuthResult;
import com.capitalfourge.portfoliomanager.application.ports.dto.auth.ChangeEmailCommand;
import com.capitalfourge.portfoliomanager.application.ports.dto.auth.ChangePasswordCommand;
import com.capitalfourge.portfoliomanager.application.ports.dto.auth.LoginCommand;
import com.capitalfourge.portfoliomanager.application.ports.dto.auth.RefreshCommand;
import com.capitalfourge.portfoliomanager.application.ports.dto.auth.RegisterCommand;
import com.capitalfourge.portfoliomanager.application.ports.in.UserUseCase;
import com.capitalfourge.portfoliomanager.application.ports.out.TokenRepository;
import com.capitalfourge.portfoliomanager.application.ports.out.TokenService;
import com.capitalfourge.portfoliomanager.application.ports.out.UserRepository;
import com.capitalfourge.portfoliomanager.application.validation.EmailValidator;
import com.capitalfourge.portfoliomanager.domain.Role;
import com.capitalfourge.portfoliomanager.domain.User;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService implements UserUseCase {

    private final UserRepository userRepository;
    private final TokenService tokenService;
    private final TokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailValidator emailValidator;

    private static final long REFRESH_TTL_SECONDS = 60L * 60L * 24L * 7L;

    @Override
    public AuthResult register(RegisterCommand command) {
        // Validate email
        EmailValidator.ValidationResult emailValidation = emailValidator.validate(command.getEmail());
        if (!emailValidation.valid()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, emailValidation.reason());
        }

        if (userRepository.existsByEmail(command.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Este correo ya está registrado");
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
        // Validate email format
        EmailValidator.ValidationResult emailValidation = emailValidator.validate(command.getEmail());
        if (!emailValidation.valid()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Credenciales inválidas");
        }

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
        userRepository.findById(userId).ifPresent(user -> {
            user.setActive(false);
            userRepository.save(user);
        });
    }

    @Override
    public void changePassword(ChangePasswordCommand command) {
        User user = userRepository.findById(command.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(command.getCurrentPassword(), user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(command.getNewPassword()));
        userRepository.save(user);
        refreshTokenRepository.deleteByUserId(user.getId());
    }

    @Override
    public void changeEmail(ChangeEmailCommand command) {
        // Validate new email
        EmailValidator.ValidationResult emailValidation = emailValidator.validate(command.getNewEmail());
        if (!emailValidation.valid()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, emailValidation.reason());
        }

        User user = userRepository.findById(command.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (userRepository.existsByEmail(command.getNewEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Este correo ya está registrado");
        }

        user.setEmail(command.getNewEmail());
        userRepository.save(user);
        refreshTokenRepository.deleteByUserId(user.getId());
    }

    @Override
    public User updateProfile(UUID userId, String username, String email, String language) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (username != null && !username.isBlank()) {
            user.setUsername(username);
        }
        if (email != null && !email.isBlank()) {
            EmailValidator.ValidationResult emailValidation = emailValidator.validate(email);
            if (!emailValidation.valid()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, emailValidation.reason());
            }
            if (userRepository.existsByEmail(email)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Este correo ya está registrado");
            }
            user.setEmail(email);
        }
        if (language != null && !language.isBlank()) {
            user.setLanguage(language);
        }
        return userRepository.save(user);
    }

    @Override
    public User deposit(UUID userId, BigDecimal amount) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setCashBalance(user.getCashBalance().add(amount));
        return userRepository.save(user);
    }

    @Override
    public User withdraw(UUID userId, BigDecimal amount) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getCashBalance().compareTo(amount) < 0) {
            throw new RuntimeException("Insufficient balance");
        }
        user.setCashBalance(user.getCashBalance().subtract(amount));
        return userRepository.save(user);
    }

    @Override
    public List<User> adminGetAllUsers() {
        return userRepository.findAll();
    }

    @Override
    public void adminSetRole(UUID userId, Role role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setRole(role);
        userRepository.save(user);
    }

    @Override
    public void adminDeactivateUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setActive(false);
        userRepository.save(user);
    }

    @Override
    public User dismissWelcome(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setShowWelcome(false);
        return userRepository.save(user);
    }
}
