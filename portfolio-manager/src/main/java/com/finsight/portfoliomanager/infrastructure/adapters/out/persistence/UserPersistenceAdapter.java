package com.finsight.portfoliomanager.infrastructure.adapters.out.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.finsight.portfoliomanager.application.ports.out.UserRepository;
import com.finsight.portfoliomanager.domain.User;
import com.finsight.portfoliomanager.infrastructure.adapters.out.persistence.Entities.UserEntity;
import com.finsight.portfoliomanager.infrastructure.adapters.out.persistence.Repositories.JpaUserRepository;

import lombok.RequiredArgsConstructor;

@Component
public class UserPersistenceAdapter implements UserRepository {

    private final JpaUserRepository jpaRepository;

    public UserPersistenceAdapter(JpaUserRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    // Map a potentially-null language to a safe default
    public static String mapLanguage(String language) {
        return language != null ? language : "ES";
    }

    @Override
    public Optional<User> findById(UUID userId) {
        return jpaRepository.findById(userId).map(this::toDomain);
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return jpaRepository.findByEmail(email).map(this::toDomain);
    }

    @Override
    public boolean existsByEmail(String email) {
        return jpaRepository.existsByEmail(email);
    }

    @Override
    public User save(User user) {
        UserEntity entity = toEntity(user);
        UserEntity saved = jpaRepository.save(entity);
        return toDomain(saved);
    }

    @Override
    public List<User> findAll() {
        return jpaRepository.findAll().stream()
                .map(this::toDomain)
                .toList();
    }

    private UserEntity toEntity(User domain) {
        UserEntity entity = new UserEntity();
        entity.setId(domain.getId());
        entity.setEmail(domain.getEmail());
        entity.setPassword(domain.getPassword());
        entity.setUsername(domain.getUsername());
        entity.setRole(domain.getRole());
        entity.setActive(domain.isActive());
        entity.setCreatedAt(domain.getCreatedAt());
        entity.setLastLoginAt(domain.getLastLoginAt());
        entity.setCashBalance(domain.getCashBalance());
        entity.setLockedBalance(domain.getLockedBalance());
        entity.setLanguage(domain.getLanguage());
        entity.setShowWelcome(domain.isShowWelcome());
        return entity;
    }

    private User toDomain(UserEntity entity) {
        User user = new User();
        user.setId(entity.getId());
        user.setEmail(entity.getEmail());
        user.setPassword(entity.getPassword());
        user.setUsername(entity.getUsername());
        user.setRole(entity.getRole());
        user.setActive(entity.isActive());
        user.setCreatedAt(entity.getCreatedAt());
        user.setLastLoginAt(entity.getLastLoginAt());
        user.setCashBalance(entity.getCashBalance());
        user.setLockedBalance(entity.getLockedBalance());
        user.setLanguage(entity.getLanguage() != null ? entity.getLanguage() : mapLanguage(null));
        user.setShowWelcome(entity.isShowWelcome());
        return user;
    }

}
