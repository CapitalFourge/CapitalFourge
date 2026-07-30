package com.capitalfourge.portfoliomanager.application.ports.out;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.capitalfourge.portfoliomanager.domain.Feedback;

public interface FeedbackRepository {

    Feedback save(Feedback feedback);

    Page<Feedback> findByUserId(UUID userId, Pageable pageable);

    Page<Feedback> findAll(Pageable pageable);

    Page<Feedback> findByRead(boolean read, Pageable pageable);

    Page<Feedback> findByCategory(Feedback.Category category, Pageable pageable);

    // Legacy methods (for backward compatibility)
    List<Feedback> findByUserId(UUID userId);

    List<Feedback> findAll();

    List<Feedback> findByRead(boolean read);

    List<Feedback> findByCategory(Feedback.Category category);
}
