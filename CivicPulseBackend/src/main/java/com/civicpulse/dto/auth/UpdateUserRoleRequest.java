package com.civicpulse.dto.auth;

import com.civicpulse.enums.Role;
import jakarta.validation.constraints.NotNull;

public record UpdateUserRoleRequest(@NotNull Role role) {}
