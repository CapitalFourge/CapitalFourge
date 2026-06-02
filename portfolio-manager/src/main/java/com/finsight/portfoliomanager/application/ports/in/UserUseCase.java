package com.finsight.portfoliomanager.application.ports.in;

import java.util.List;
import java.util.UUID;
import java.util.Optional;

import com.finsight.portfoliomanager.application.ports.dto.auth.*;
import com.finsight.portfoliomanager.domain.Role;
import com.finsight.portfoliomanager.domain.User;

public interface UserUseCase {
    // AUTH
    AuthResult register(RegisterCommand command);

    AuthResult login(LoginCommand command);

    AuthResult refresh(RefreshCommand command);

    void logout(UUID userId);

    // ACCOUNT
    Optional<User> findById(UUID userId);

    Optional<User> findByEmail(String email);

    void deactivate(UUID userId);

    void changePassword(ChangePasswordCommand command);

    void changeEmail(ChangeEmailCommand command);

    User updateProfile(UUID userId, String username, String email, String language);

    User deposit(UUID userId, java.math.BigDecimal amount);

    User withdraw(UUID userId, java.math.BigDecimal amount);

    // ADMIN
    List<User> adminGetAllUsers();

    void adminSetRole(UUID userId, Role role);

    void adminDeactivateUser(UUID userId);

    User dismissWelcome(UUID userId);
}
