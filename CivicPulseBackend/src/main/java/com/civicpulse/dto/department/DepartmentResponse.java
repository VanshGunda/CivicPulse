package com.civicpulse.dto.department;

import com.civicpulse.entity.Department;
import java.time.Instant;

public record DepartmentResponse(Long id, String name, String description, boolean active, Instant createdAt) {
    public static DepartmentResponse from(Department department) {
        return new DepartmentResponse(department.getId(), department.getName(), department.getDescription(), department.isActive(), department.getCreatedAt());
    }
}
