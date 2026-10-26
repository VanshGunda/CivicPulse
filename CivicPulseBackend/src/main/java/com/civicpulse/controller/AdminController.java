package com.civicpulse.controller;

import com.civicpulse.dto.auth.UpdateUserEnabledRequest;
import com.civicpulse.dto.auth.UpdateUserRoleRequest;
import com.civicpulse.dto.auth.UserResponse;
import com.civicpulse.security.CurrentUserService;
import com.civicpulse.service.AdminService;
import com.civicpulse.service.PageableSupport;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    private final AdminService adminService;
    private final CurrentUserService currentUserService;

    public AdminController(AdminService adminService, CurrentUserService currentUserService) {
        this.adminService = adminService;
        this.currentUserService = currentUserService;
    }

    @GetMapping("/users")
    public Page<UserResponse> users(@RequestParam(required = false) String q,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return adminService.listUsers(q, PageableSupport.cap(pageable, 100, "createdAt"));
    }

    @PatchMapping("/users/{id}/role")
    public UserResponse updateRole(@PathVariable Long id, @Valid @RequestBody UpdateUserRoleRequest request) {
        return adminService.updateRole(id, request, currentUserService.getCurrentUser());
    }

    @PatchMapping("/users/{id}/enabled")
    public UserResponse updateEnabled(@PathVariable Long id, @Valid @RequestBody UpdateUserEnabledRequest request) {
        return adminService.updateEnabled(id, request, currentUserService.getCurrentUser());
    }
}
