package com.civicpulse.dto.issue;

import java.util.List;

public record IssueCreateResult(IssueResponse issue, List<DuplicateIssueResponse> possibleDuplicates) {}
