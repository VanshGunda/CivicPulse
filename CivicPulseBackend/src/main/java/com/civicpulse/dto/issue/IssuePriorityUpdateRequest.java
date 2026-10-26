package com.civicpulse.dto.issue;

import com.civicpulse.enums.Priority;
import jakarta.validation.constraints.NotNull;

public record IssuePriorityUpdateRequest(@NotNull Priority priority) {}
