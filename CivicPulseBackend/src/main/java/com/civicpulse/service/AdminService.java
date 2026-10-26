package com.civicpulse.service;

import com.civicpulse.dto.auth.UpdateUserEnabledRequest;
import com.civicpulse.dto.auth.UpdateUserRoleRequest;
import com.civicpulse.dto.auth.UserResponse;
import com.civicpulse.entity.User;
import com.civicpulse.exception.ConflictException;
import com.civicpulse.exception.ResourceNotFoundException;
import com.civicpulse.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminService {
    private final UserRepository userRepository;

    public AdminService(UserRepository userRepository) { this.userRepository = userRepository; }

    @Transactional(readOnly = true)
    public Page<UserResponse> listUsers(String search, Pageable pageable) {
        Page<User> users;
        if (search == null || search.isBlank()) {
            users = userRepository.findAll(pageable);
        } else {
            String term = search.trim();
            users = userRepository.findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(term, term, pageable);
        }
        return users.map(UserResponse::from);
    }

    @Transactional
    public UserResponse updateRole(Long userId, UpdateUserRoleRequest request, User currentUser) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        if (user.getId().equals(currentUser.getId()) && request.role() != currentUser.getRole()) {
            throw new ConflictException("You cannot change your own role");
        }
        user.setRole(request.role());
        return UserResponse.from(user);
    }

    @Transactional
    public UserResponse updateEnabled(Long userId, UpdateUserEnabledRequest request, User currentUser) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        if (user.getId().equals(currentUser.getId()) && !request.enabled()) {
            throw new ConflictException("You cannot disable your own account");
        }
        user.setEnabled(request.enabled());
        return UserResponse.from(user);
    }
}
