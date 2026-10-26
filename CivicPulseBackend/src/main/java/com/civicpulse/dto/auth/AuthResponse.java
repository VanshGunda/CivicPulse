package com.civicpulse.dto.auth;

public record AuthResponse(String tokenType, String accessToken, long expiresInSeconds, UserResponse user) {}
