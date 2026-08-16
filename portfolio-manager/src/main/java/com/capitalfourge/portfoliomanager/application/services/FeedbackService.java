package com.capitalfourge.portfoliomanager.application.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
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
        Feedback feedback = new Feedback(
                UUID.randomUUID(),
                userId,
                username,
                category,
                message,
                LocalDateTime.now(),
                false
        );

        return feedbackRepository.save(feedback);
    }

    @Override
    public List<Feedback> myFeedbacks(UUID userId) {
        return feedbackRepository.findByUserId(userId, Pageable.unpaged()).getContent();
    }

    @Override
    public List<Feedback> allFeedbacks() {
        return feedbackRepository.findAll(Pageable.unpaged()).getContent();
    }

    @Override
    public List<Feedback> feedbacksByCategory(Feedback.Category category) {
        return feedbackRepository.findByCategory(category, Pageable.unpaged()).getContent();
    }

    @Override
    public List<Feedback> unreadFeedbacks() {
        return feedbackRepository.findByRead(false, Pageable.unpaged()).getContent();
    }
}
