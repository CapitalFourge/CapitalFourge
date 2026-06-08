package com.capitalfourge.portfoliomanager.application.services;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.capitalfourge.portfoliomanager.application.ports.in.FeedbackUseCase;
import com.capitalfourge.portfoliomanager.application.ports.out.FeedbackRepository;
import com.capitalfourge.portfoliomanager.domain.Feedback;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FeedbackService implements FeedbackUseCase {

    private final FeedbackRepository feedbackRepository;

    @Override
    public Feedback submit(UUID userId, String username, Feedback.Category category, String message) {
        Feedback feedback = Feedback.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .username(username)
                .category(category)
                .message(message)
                .createdAt(LocalDateTime.now())
                .read(false)
                .build();

        return feedbackRepository.save(feedback);
    }

    @Override
    public List<Feedback> myFeedbacks(UUID userId) {
        return feedbackRepository.findByUserId(userId);
    }

    @Override
    public List<Feedback> allFeedbacks() {
        return feedbackRepository.findAll();
    }

    @Override
    public List<Feedback> feedbacksByCategory(Feedback.Category category) {
        return feedbackRepository.findByCategory(category);
    }

    @Override
    public List<Feedback> unreadFeedbacks() {
        return feedbackRepository.findByRead(false);
    }
}
