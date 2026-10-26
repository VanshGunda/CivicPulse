package com.civicpulse.dto.dashboard;

import com.civicpulse.enums.IssueCategory;
import com.civicpulse.enums.IssueStatus;
import java.util.Map;

public record DashboardSummaryResponse(
    long totalIssues,
    long openIssues,
    long resolvedIssues,
    long overdueIssues,
    double averageResolutionHours,
    Map<IssueStatus, Long> byStatus,
    Map<IssueCategory, Long> byCategory
) {}
