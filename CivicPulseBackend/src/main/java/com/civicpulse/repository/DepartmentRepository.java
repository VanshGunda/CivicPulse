package com.civicpulse.repository;

import com.civicpulse.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DepartmentRepository extends JpaRepository<Department, Long> {
    boolean existsByNameIgnoreCase(String name);
    List<Department> findByActiveTrueOrderByNameAsc();
}
