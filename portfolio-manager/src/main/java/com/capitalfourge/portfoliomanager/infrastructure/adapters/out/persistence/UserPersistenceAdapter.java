package com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.capitalfourge.portfoliomanager.application.ports.out.UserRepository;
import com.capitalfourge.portfoliomanager.domain.User;
import com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence.Entities.UserEntity;
import com.capitalfourge.portfoliomanager.infrastructure.adapters.out.persistence.Repositories.JpaUserRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class UserPersistenceAdapter implements UserRepository {

    private final JpaUserRepository jpaRepository;
    private final PasswordEncoder passwordEncoder;

    // P2-10: Keep static mapLanguage method for backward compatibility (used in tests)
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
    public Page<User> findAll(Pageable pageable) {
        return jpaRepository.findAll(pageable).map(this::toDomain);
    }

    // P2-11: Legacy method for backward compatibility
    @Override
    public List<User> findAll() {
        return jpaRepository.findAll(org.springframework.data.domain.Pageable.unpaged())
                .stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteById(UUID userId) {
        jpaRepository.deleteById(userId);
    }

    @Override
    public boolean existsById(UUID userId) {
        return jpaRepository.existsById(userId);
    }

    private UserEntity toEntity(User domain) {
        UserEntity entity = new UserEntity();
        entity.setId(domain.getId());
        entity.setEmail(domain.getEmail());
        // Hash password if it's not already a BCrypt hash
        String password = domain.getPassword();
        if (password != null && !password.startsWith("$2a$") && !password.startsWith("$2b$") && !password.startsWith("$2y$")) {
            password = passwordEncoder.encode(password);
        }
        entity.setPassword(password);
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
        user.setLanguage(entity.getLanguage() != null ? entity.getLanguage() : "ES");
        user.setShowWelcome(entity.isShowWelcome());
        return user;
    }

}
