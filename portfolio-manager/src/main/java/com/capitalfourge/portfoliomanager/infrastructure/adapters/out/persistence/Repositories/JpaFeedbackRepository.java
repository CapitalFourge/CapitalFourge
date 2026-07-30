package com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence.Repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence.Entities.FeedbackEntity;

public interface JpaFeedbackRepository extends JpaRepository<FeedbackEntity, UUID> {

    Page<FeedbackEntity> findByUserId(UUID userId, Pageable pageable);

    Page<FeedbackEntity> findByRead(boolean read, Pageable pageable);

    Page<FeedbackEntity> findByCategory(FeedbackEntity.Category category, Pageable pageable);
}
