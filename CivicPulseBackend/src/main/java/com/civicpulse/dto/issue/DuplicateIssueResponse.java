package com.civicpulse.dto.issue;

import com.civicpulse.enums.IssueCategory;
import com.civicpulse.enums.IssueStatus;
import java.time.Instant;

public record DuplicateIssueResponse(Long id, String title, IssueCategory category, IssueStatus status,
                                     String address, long distanceMeters, Instant createdAt) {}
