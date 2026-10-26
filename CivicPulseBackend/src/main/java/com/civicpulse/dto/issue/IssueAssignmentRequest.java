package com.civicpulse.dto.issue;

import jakarta.validation.constraints.NotNull;

public record IssueAssignmentRequest(@NotNull Long assigneeId, Long departmentId) {}
