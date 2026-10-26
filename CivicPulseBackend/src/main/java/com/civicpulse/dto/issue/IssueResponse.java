package com.civicpulse.dto.issue;

import com.civicpulse.enums.IssueCategory;
import com.civicpulse.enums.IssueStatus;
import com.civicpulse.enums.Priority;
import java.time.Instant;

public record IssueResponse(
    Long id,
    String title,
    String description,
    IssueCategory category,
    IssueStatus status,
    Priority priority,
    String address,
    Double latitude,
    Double longitude,
    String photoUrl,
    Long reporterId,
    String reporterName,
    Long assigneeId,
    String assigneeName,
    Long departmentId,
    String departmentName,
    long supportCount,
    Instant dueAt,
    Instant resolvedAt,
    Instant createdAt,
    Instant updatedAt,
    Long version
) {}
