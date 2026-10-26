package com.civicpulse.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @NotBlank @Size(max = 80) String name,
    @NotBlank @Email @Size(max = 190) String email,
    @NotBlank @Size(min = 8, max = 72, message = "Password must contain between 8 and 72 characters") String password
) {}
