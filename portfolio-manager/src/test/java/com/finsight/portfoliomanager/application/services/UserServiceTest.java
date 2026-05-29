package com.finsight.portfoliomanager.application.services;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.finsight.portfoliomanager.application.ports.out.TokenRepository;
import com.finsight.portfoliomanager.application.ports.out.TokenService;
import com.finsight.portfoliomanager.application.ports.out.UserRepository;
import com.finsight.portfoliomanager.domain.Role;
import com.finsight.portfoliomanager.domain.User;

/**
 * Tests for admin panel user management features.
 * These tests use Mockito to mock external dependencies.
 */
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private TokenService tokenService;

    @Mock
    private TokenRepository refreshTokenRepository;

    @InjectMocks
    private UserService userService;

    private User user;
    private User adminUser;

    @BeforeEach
    void setUp() {
        UUID userId = UUID.randomUUID();
        UUID adminId = UUID.randomUUID();

        user = User.builder()
                .id(userId)
                .email("user@test.com")
                .username("user")
                .role(Role.USER)
                .active(true)
                .build();

        adminUser = User.builder()
                .id(adminId)
                .email("admin@test.com")
                .username("admin")
                .role(Role.ADMIN)
                .active(true)
                .build();
    }

    @Test
    void adminGetAllUsers_ReturnsAllUsers() {
        when(userRepository.findAll()).thenReturn(List.of(user, adminUser));

        List<User> result = userService.adminGetAllUsers();

        assertEquals(2, result.size());
        verify(userRepository, times(1)).findAll();
    }

    @Test
    void adminSetRole_ChangesUserRole() {
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        userService.adminSetRole(user.getId(), Role.ADMIN);

        verify(userRepository, times(1)).findById(user.getId());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void adminDeactivateUser_DeactivatesUser() {
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        userService.adminDeactivateUser(user.getId());

        verify(userRepository, times(1)).findById(user.getId());
        verify(userRepository, times(1)).save(any(User.class));
        verify(refreshTokenRepository, times(1)).deleteByUserId(user.getId());
    }

    @Test
    void adminSetRole_ThrowsForNonExistentUser() {
        UUID nonExistentId = UUID.randomUUID();
        when(userRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> userService.adminSetRole(nonExistentId, Role.ADMIN));
    }
}