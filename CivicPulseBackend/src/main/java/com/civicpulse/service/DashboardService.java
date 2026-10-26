package com.civicpulse.service;

import com.civicpulse.dto.dashboard.DashboardSummaryResponse;
import com.civicpulse.enums.IssueCategory;
import com.civicpulse.enums.IssueStatus;
import com.civicpulse.repository.CategoryCountProjection;
import com.civicpulse.repository.IssueRepository;
import com.civicpulse.repository.IssueRepository.StatusCountProjection;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Duration;
import java.time.Instant;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Service
public class DashboardService {
    private static final List<IssueStatus> OPEN_STATUSES = List.of(
        IssueStatus.SUBMITTED, IssueStatus.VERIFIED, IssueStatus.ASSIGNED, IssueStatus.IN_PROGRESS);
    private final IssueRepository issueRepository;

    public DashboardService(IssueRepository issueRepository) { this.issueRepository = issueRepository; }

    @Transactional(readOnly = true)
    public DashboardSummaryResponse summary() {
        long total = issueRepository.count();
        long open = issueRepository.countByStatusIn(OPEN_STATUSES);
        long resolved = issueRepository.countByStatus(IssueStatus.RESOLVED);
        long overdue = issueRepository.countByDueAtBeforeAndStatusIn(Instant.now(), OPEN_STATUSES);

        Map<IssueStatus, Long> statusCounts = new EnumMap<>(IssueStatus.class);
        for (IssueStatus status : IssueStatus.values()) statusCounts.put(status, 0L);
        for (StatusCountProjection row : issueRepository.countGroupedByStatus()) statusCounts.put(row.getStatus(), row.getTotalCount());

        Map<IssueCategory, Long> categoryCounts = new EnumMap<>(IssueCategory.class);
        for (IssueCategory category : IssueCategory.values()) categoryCounts.put(category, 0L);
        for (CategoryCountProjection row : issueRepository.countGroupedByCategory()) categoryCounts.put(row.getCategory(), row.getTotalCount());

        List<com.civicpulse.entity.Issue> resolvedIssues = issueRepository
            .findTop1000ByStatusAndResolvedAtIsNotNullOrderByResolvedAtDesc(IssueStatus.RESOLVED);
        double averageHours = resolvedIssues.stream()
            .filter(issue -> issue.getCreatedAt() != null && issue.getResolvedAt() != null)
            .mapToLong(issue -> Math.max(0, Duration.between(issue.getCreatedAt(), issue.getResolvedAt()).toSeconds()))
            .average().orElse(0.0) / 3600.0;

        return new DashboardSummaryResponse(total, open, resolved, overdue,
            Math.round(averageHours * 100.0) / 100.0, Map.copyOf(statusCounts), Map.copyOf(categoryCounts));
    }
}
