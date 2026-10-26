package com.civicpulse.dto.issue;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record IssueCommentRequest(@NotBlank @Size(max = 2000) String message, boolean internal) {}
