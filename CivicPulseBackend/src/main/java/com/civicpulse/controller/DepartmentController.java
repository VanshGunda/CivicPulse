package com.civicpulse.controller;

import com.civicpulse.dto.department.DepartmentRequest;
import com.civicpulse.dto.department.DepartmentResponse;
import com.civicpulse.service.DepartmentService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/departments")
public class DepartmentController {
    private final DepartmentService departmentService;

    public DepartmentController(DepartmentService departmentService) { this.departmentService = departmentService; }

    @GetMapping
    public List<DepartmentResponse> activeDepartments() { return departmentService.listActive(); }

    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public List<DepartmentResponse> allDepartments() { return departmentService.listAll(); }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public DepartmentResponse create(@Valid @RequestBody DepartmentRequest request) {
        return departmentService.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public DepartmentResponse update(@PathVariable Long id, @Valid @RequestBody DepartmentRequest request) {
        return departmentService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void deactivate(@PathVariable Long id) { departmentService.deactivate(id); }
}
