package com.civicpulse.dto.issue;

import com.civicpulse.enums.CommentVisibility;
import java.time.Instant;

public record IssueCommentResponse(Long id, Long issueId, Long authorId, String authorName,
                                   String message, CommentVisibility visibility, Instant createdAt) {}
