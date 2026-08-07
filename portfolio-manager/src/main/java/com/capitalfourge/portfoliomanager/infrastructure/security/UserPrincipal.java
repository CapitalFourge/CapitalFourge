package com.capitalfourge.portfoliomanager.infrastructure.security;

import java.security.Principal;
import java.util.UUID;

public record UserPrincipal(UUID userId, String username, String email) implements Principal {
    @Override
    public String getName() {
        return username;
    }
}