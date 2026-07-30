package com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.capitalfourge.portfoliomanager.application.ports.out.FeedbackRepository;
import com.capitalfourge.portfoliomanager.domain.Feedback;
import com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence.Entities.FeedbackEntity;
import com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence.Repositories.JpaFeedbackRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class FeedbackPersistenceAdapter implements FeedbackRepository {

    private final JpaFeedbackRepository jpaRepository;

    @Override
    @Transactional
    public Feedback save(Feedback feedback) {
        FeedbackEntity entity = toEntity(feedback);
        FeedbackEntity saved = jpaRepository.save(entity);
        return toDomain(saved);
    }

    @Override
    public Page<Feedback> findByUserId(UUID userId, Pageable pageable) {
        return jpaRepository.findByUserId(userId, pageable).map(this::toDomain);
    }

    @Override
    public Page<Feedback> findAll(Pageable pageable) {
        return jpaRepository.findAll(pageable).map(this::toDomain);
    }

    @Override
    public Page<Feedback> findByRead(boolean read, Pageable pageable) {
        return jpaRepository.findByRead(read, pageable).map(this::toDomain);
    }

    @Override
    public Page<Feedback> findByCategory(Feedback.Category category, Pageable pageable) {
        return jpaRepository.findByCategory(FeedbackEntity.Category.valueOf(category.name()), pageable)
                .map(this::toDomain);
    }

    // Legacy methods (for backward compatibility)
    @Override
    public List<Feedback> findByUserId(UUID userId) {
        return jpaRepository.findByUserId(userId, org.springframework.data.domain.Pageable.unpaged())
                .stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<Feedback> findAll() {
        return jpaRepository.findAll(org.springframework.data.domain.Pageable.unpaged())
                .stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<Feedback> findByRead(boolean read) {
        return jpaRepository.findByRead(read, org.springframework.data.domain.Pageable.unpaged())
                .stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<Feedback> findByCategory(Feedback.Category category) {
        return jpaRepository.findByCategory(FeedbackEntity.Category.valueOf(category.name()), org.springframework.data.domain.Pageable.unpaged())
                .stream()
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
        if (entity == null) {
            return null;
        }
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
