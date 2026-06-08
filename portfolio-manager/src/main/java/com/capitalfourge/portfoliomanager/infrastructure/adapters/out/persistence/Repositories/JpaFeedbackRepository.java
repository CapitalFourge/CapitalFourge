package com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence.Repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence.Entities.FeedbackEntity;

public interface JpaFeedbackRepository extends JpaRepository<FeedbackEntity, UUID> {

    List<FeedbackEntity> findByUserId(UUID userId);

    List<FeedbackEntity> findByRead(boolean read);

    List<FeedbackEntity> findByCategory(FeedbackEntity.Category category);
}
