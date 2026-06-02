package com.finsight.portfoliomanager.application.ports.out;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import com.finsight.portfoliomanager.domain.Feedback;

public interface FeedbackRepository {

    Feedback save(Feedback feedback);

    List<Feedback> findByUserId(UUID userId);

    List<Feedback> findAll();

    List<Feedback> findByRead(boolean read);

    List<Feedback> findByCategory(Feedback.Category category);
}
