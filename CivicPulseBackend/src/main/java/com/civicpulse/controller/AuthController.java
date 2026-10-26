package com.civicpulse.controller;

import com.civicpulse.dto.auth.AuthResponse;
import com.civicpulse.dto.auth.LoginRequest;
import com.civicpulse.dto.auth.RegisterRequest;
import com.civicpulse.dto.auth.UserResponse;
import com.civicpulse.security.CurrentUserService;
import com.civicpulse.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;
    private final CurrentUserService currentUserService;

    public AuthController(AuthService authService, CurrentUserService currentUserService) {
        this.authService = authService;
        this.currentUserService = currentUserService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public UserResponse me() {
        return UserResponse.from(currentUserService.getCurrentUser());
    }
}
