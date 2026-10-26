package com.civicpulse.dto.issue;

import com.civicpulse.enums.IssueCategory;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record IssueUpdateRequest(
    @NotBlank @Size(max = 120) String title,
    @NotBlank @Size(max = 5000) String description,
    @NotNull IssueCategory category,
    @NotBlank @Size(max = 255) String address,
    @DecimalMin("-90.0") @DecimalMax("90.0") Double latitude,
    @DecimalMin("-180.0") @DecimalMax("180.0") Double longitude,
    @Size(max = 1000) String photoUrl
) {}
