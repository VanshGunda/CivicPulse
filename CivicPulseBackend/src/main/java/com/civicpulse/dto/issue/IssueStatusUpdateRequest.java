package com.civicpulse.dto.issue;

import com.civicpulse.enums.IssueStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record IssueStatusUpdateRequest(@NotNull IssueStatus status, @Size(max = 1000) String comment) {}
