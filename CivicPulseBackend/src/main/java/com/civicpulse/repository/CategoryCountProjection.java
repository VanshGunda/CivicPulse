package com.civicpulse.repository;

import com.civicpulse.enums.IssueCategory;

public interface CategoryCountProjection {
    IssueCategory getCategory();
    Long getTotalCount();
}
