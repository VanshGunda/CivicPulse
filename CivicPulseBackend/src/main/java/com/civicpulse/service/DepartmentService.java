package com.civicpulse.service;

import com.civicpulse.dto.department.DepartmentRequest;
import com.civicpulse.dto.department.DepartmentResponse;
import com.civicpulse.entity.Department;
import com.civicpulse.exception.ConflictException;
import com.civicpulse.exception.ResourceNotFoundException;
import com.civicpulse.repository.DepartmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class DepartmentService {
    private final DepartmentRepository departmentRepository;

    public DepartmentService(DepartmentRepository departmentRepository) { this.departmentRepository = departmentRepository; }

    @Transactional(readOnly = true)
    public List<DepartmentResponse> listActive() {
        return departmentRepository.findByActiveTrueOrderByNameAsc().stream().map(DepartmentResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<DepartmentResponse> listAll() {
        return departmentRepository.findAll().stream().map(DepartmentResponse::from).toList();
    }

    @Transactional
    public DepartmentResponse create(DepartmentRequest request) {
        String name = request.name().trim();
        if (departmentRepository.existsByNameIgnoreCase(name)) throw new ConflictException("A department with this name already exists");
        Department department = new Department();
        department.setName(name);
        department.setDescription(request.description());
        return DepartmentResponse.from(departmentRepository.save(department));
    }

    @Transactional
    public DepartmentResponse update(Long id, DepartmentRequest request) {
        Department department = departmentRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Department not found: " + id));
        String name = request.name().trim();
        if (!department.getName().equalsIgnoreCase(name) && departmentRepository.existsByNameIgnoreCase(name)) {
            throw new ConflictException("A department with this name already exists");
        }
        department.setName(name);
        department.setDescription(request.description());
        return DepartmentResponse.from(departmentRepository.save(department));
    }

    @Transactional
    public void deactivate(Long id) {
        Department department = departmentRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Department not found: " + id));
        department.setActive(false); // Soft-deactivation preserves historical issue relationships.
    }
}
