package com.civicpulse.controller;

import com.civicpulse.dto.dashboard.DashboardSummaryResponse;
import com.civicpulse.service.DashboardService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
public class DashboardController {
    private final DashboardService dashboardService;
    public DashboardController(DashboardService dashboardService) { this.dashboardService = dashboardService; }

    @GetMapping("/summary")
    public DashboardSummaryResponse summary() { return dashboardService.summary(); }
}
