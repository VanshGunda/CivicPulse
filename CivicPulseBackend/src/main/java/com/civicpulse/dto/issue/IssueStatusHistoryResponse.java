package com.civicpulse.dto.issue;

import com.civicpulse.enums.IssueStatus;
import java.time.Instant;

public record IssueStatusHistoryResponse(Long id, IssueStatus fromStatus, IssueStatus toStatus,
                                         String comment, Long changedById, String changedByName,
                                         Instant createdAt) {}
