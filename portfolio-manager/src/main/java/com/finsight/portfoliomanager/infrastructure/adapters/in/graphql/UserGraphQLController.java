package com.finsight.portfoliomanager.infrastructure.adapters.in.graphql;

import java.util.UUID;

import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;

import com.finsight.portfoliomanager.application.ports.dto.auth.ChangePasswordCommand;
import com.finsight.portfoliomanager.application.ports.in.PortfolioUseCase;
import com.finsight.portfoliomanager.application.ports.in.UserUseCase;
import com.finsight.portfoliomanager.domain.User;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class UserGraphQLController {

    private final UserUseCase userUseCase;
    private final PortfolioUseCase portfolioUseCase;

    @MutationMapping
    public User updateProfile(
            @Argument("username") String username,
            @Argument("email") String email,
            @Argument("language") String language,
            @AuthenticationPrincipal UUID userId) {

        if (userId == null) {
            throw new RuntimeException("User not authenticated");
        }

        return userUseCase.updateProfile(userId, username, email, language);
    }

    @MutationMapping
    public Boolean changePassword(
            @Argument("oldPassword") String oldPassword,
            @Argument("newPassword") String newPassword,
            @AuthenticationPrincipal UUID userId) {

        if (userId == null) {
            throw new RuntimeException("User not authenticated");
        }

        ChangePasswordCommand command = new ChangePasswordCommand(userId, oldPassword, newPassword);
        userUseCase.changePassword(command);
        return true;
    }

    @MutationMapping
    public Boolean repairMyBalance(@AuthenticationPrincipal UUID userId) {
        if (userId == null) {
            throw new RuntimeException("User not authenticated");
        }
        portfolioUseCase.repairUserBalance(userId);
        return true;
    }

    @MutationMapping
    public User dismissWelcome(@AuthenticationPrincipal UUID userId) {
        if (userId == null) {
            throw new RuntimeException("User not authenticated");
        }
        return userUseCase.dismissWelcome(userId);
    }
}
