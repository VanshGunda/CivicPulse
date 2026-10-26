package com.civicpulse.service;

import com.civicpulse.dto.auth.AuthResponse;
import com.civicpulse.dto.auth.LoginRequest;
import com.civicpulse.dto.auth.RegisterRequest;
import com.civicpulse.dto.auth.UserResponse;
import com.civicpulse.entity.User;
import com.civicpulse.enums.Role;
import com.civicpulse.exception.ConflictException;
import com.civicpulse.repository.UserRepository;
import com.civicpulse.security.JwtService;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ConflictException("An account with this email already exists");
        }
        User user = new User();
        user.setName(request.name().trim());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(Role.RESIDENT); // Public registration can never grant staff/admin privileges.
        user.setEnabled(true);
        user = userRepository.save(user);
        return responseFor(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(request.email().trim())
            .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));
        if (!user.isEnabled() || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }
        return responseFor(user);
    }

    private AuthResponse responseFor(User user) {
        return new AuthResponse("Bearer", jwtService.generateToken(user), jwtService.getExpirationSeconds(), UserResponse.from(user));
    }
}
