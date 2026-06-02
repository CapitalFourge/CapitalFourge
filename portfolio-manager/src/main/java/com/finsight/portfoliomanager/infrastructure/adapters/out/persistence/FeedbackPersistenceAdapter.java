package com.finsight.portfoliomanager.infrastructure.adapters.out.persistence;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.finsight.portfoliomanager.application.ports.out.FeedbackRepository;
import com.finsight.portfoliomanager.domain.Feedback;
import com.finsight.portfoliomanager.infrastructure.adapters.out.persistence.Entities.FeedbackEntity;
import com.finsight.portfoliomanager.infrastructure.adapters.out.persistence.Repositories.JpaFeedbackRepository;

import lombok.RequiredArgsConstructor;

@Component
public class FeedbackPersistenceAdapter implements FeedbackRepository {

    private final JpaFeedbackRepository jpaRepository;

    public FeedbackPersistenceAdapter(JpaFeedbackRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Feedback save(Feedback feedback) {
        FeedbackEntity entity = toEntity(feedback);
        FeedbackEntity saved = jpaRepository.save(entity);
        return toDomain(saved);
    }

    @Override
    public List<Feedback> findByUserId(UUID userId) {
        return jpaRepository.findByUserId(userId).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<Feedback> findAll() {
        return jpaRepository.findAll().stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<Feedback> findByRead(boolean read) {
        return jpaRepository.findByRead(read).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<Feedback> findByCategory(Feedback.Category category) {
        return jpaRepository.findByCategory(category).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    private FeedbackEntity toEntity(Feedback domain) {
        return FeedbackEntity.builder()
                .id(domain.getId())
                .userId(domain.getUserId())
                .username(domain.getUsername())
                .category(FeedbackEntity.Category.valueOf(domain.getCategory().name()))
                .message(domain.getMessage())
                .createdAt(domain.getCreatedAt())
                .read(domain.isRead())
                .build();
    }

    private Feedback toDomain(FeedbackEntity entity) {
        return Feedback.builder()
                .id(entity.getId())
                .userId(entity.getUserId())
                .username(entity.getUsername())
                .category(Feedback.Category.valueOf(entity.getCategory().name()))
                .message(entity.getMessage())
                .createdAt(entity.getCreatedAt())
                .read(entity.isRead())
                .build();
    }
}
