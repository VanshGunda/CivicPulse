package com.civicpulse.dto.auth;

import com.civicpulse.entity.User;
import com.civicpulse.enums.Role;
import java.time.Instant;

public record UserResponse(Long id, String name, String email, Role role, boolean enabled, Instant createdAt) {
    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getName(), user.getEmail(), user.getRole(), user.isEnabled(), user.getCreatedAt());
    }
}
