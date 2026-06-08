package com.capitalfourge.portfoliomanager.application.ports.in;

import java.util.List;
import java.util.UUID;

import com.capitalfourge.portfoliomanager.domain.Feedback;

public interface FeedbackUseCase {

    Feedback submit(UUID userId, String username, Feedback.Category category, String message);

    List<Feedback> myFeedbacks(UUID userId);

    List<Feedback> allFeedbacks();

    List<Feedback> feedbacksByCategory(Feedback.Category category);

    List<Feedback> unreadFeedbacks();
}
