package com.capitalfourge.portfoliomanager.application.ports.out;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.capitalfourge.portfoliomanager.domain.User;

public interface UserRepository {

    Optional<User> findById(UUID userId);

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsById(UUID userId);

    Page<User> findAll(Pageable pageable);

    User save(User user);

    void deleteById(UUID userId);

    // Legacy method (for backward compatibility)
    List<User> findAll();
}