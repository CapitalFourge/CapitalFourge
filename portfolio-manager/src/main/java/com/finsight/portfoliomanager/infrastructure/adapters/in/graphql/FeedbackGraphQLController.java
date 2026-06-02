package com.finsight.portfoliomanager.infrastructure.adapters.in.graphql;

import java.util.List;
import java.util.UUID;

import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;

import com.finsight.portfoliomanager.application.ports.in.FeedbackUseCase;
import com.finsight.portfoliomanager.application.ports.out.FeedbackRepository;
import com.finsight.portfoliomanager.domain.Feedback;
import com.finsight.portfoliomanager.infrastructure.adapters.out.persistence.FeedbackPersistenceAdapter;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class FeedbackGraphQLController {

    private final FeedbackUseCase feedbackUseCase;

    @MutationMapping
    public Feedback submitFeedback(
            @Argument("category") String category,
            @Argument("message") String message,
            @AuthenticationPrincipal UUID userId) {

        if (userId == null) {
            throw new RuntimeException("Authentication required");
        }

        return feedbackUseCase.submit(userId, extractUsername(userId), Feedback.Category.valueOf(category.toUpperCase()), message);
    }

    @QueryMapping
    public List<Feedback> myFeedbacks(@AuthenticationPrincipal UUID userId) {
        if (userId == null) {
            throw new RuntimeException("Authentication required");
        }
        return feedbackUseCase.myFeedbacks(userId);
    }

    @QueryMapping
    public List<Feedback> allFeedbacks(@AuthenticationPrincipal UUID userId) {
        if (userId == null) {
            throw new RuntimeException("Authentication required");
        }
        return feedbackUseCase.allFeedbacks();
    }

    @QueryMapping
    public List<Feedback> feedbacksByCategory(@Argument("category") String category) {
        return feedbackUseCase.feedbacksByCategory(Feedback.Category.valueOf(category.toUpperCase()));
    }

    @QueryMapping
    public List<Feedback> unreadFeedbacks() {
        return feedbackUseCase.unreadFeedbacks();
    }

    private String extractUsername(UUID userId) {
        return "Usuario_" + userId.toString().substring(0, 8);
    }
}
