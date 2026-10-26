package com.civicpulse.config;

import com.civicpulse.entity.Department;
import com.civicpulse.entity.User;
import com.civicpulse.enums.Role;
import com.civicpulse.repository.DepartmentRepository;
import com.civicpulse.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class StartupDataInitializer implements CommandLineRunner {
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String adminEmail;
    private final String adminPassword;
    private final String adminName;

    public StartupDataInitializer(DepartmentRepository departmentRepository,
                                  UserRepository userRepository,
                                  PasswordEncoder passwordEncoder,
                                  @Value("${app.bootstrap-admin.email:}") String adminEmail,
                                  @Value("${app.bootstrap-admin.password:}") String adminPassword,
                                  @Value("${app.bootstrap-admin.name:CivicPulse Administrator}") String adminName) {
        this.departmentRepository = departmentRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminEmail = adminEmail;
        this.adminPassword = adminPassword;
        this.adminName = adminName;
    }

    @Override
    public void run(String... args) {
        seedDepartments();
        seedAdminIfConfigured();
    }

    private void seedDepartments() {
        if (departmentRepository.count() > 0) return;
        createDepartment("Road Maintenance", "Road damage, potholes and footpath repairs");
        createDepartment("Sanitation", "Garbage collection and waste issues");
        createDepartment("Water Supply", "Water leakage and water supply issues");
        createDepartment("Street Lighting", "Broken or faulty street lights");
        createDepartment("Drainage", "Drainage and flooding problems");
        createDepartment("Parks and Public Spaces", "Parks, trees and public areas");
    }

    private void createDepartment(String name, String description) {
        Department department = new Department();
        department.setName(name);
        department.setDescription(description);
        department.setActive(true);
        departmentRepository.save(department);
    }

    private void seedAdminIfConfigured() {
        boolean emailProvided = adminEmail != null && !adminEmail.isBlank();
        boolean passwordProvided = adminPassword != null && !adminPassword.isBlank();
        if (!emailProvided && !passwordProvided) return;
        if (!emailProvided || !passwordProvided) {
            throw new IllegalStateException("Set both BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD, or leave both empty");
        }
        if (adminPassword.length() < 12) {
            throw new IllegalStateException("BOOTSTRAP_ADMIN_PASSWORD must contain at least 12 characters");
        }
        if (userRepository.existsByEmailIgnoreCase(adminEmail.trim())) return;

        User admin = new User();
        admin.setName(adminName == null || adminName.isBlank() ? "CivicPulse Administrator" : adminName.trim());
        admin.setEmail(adminEmail.trim().toLowerCase());
        admin.setPasswordHash(passwordEncoder.encode(adminPassword));
        admin.setRole(Role.ADMIN);
        admin.setEnabled(true);
        userRepository.save(admin);
        System.out.println("CivicPulse: bootstrap administrator created for configured email.");
    }
}
