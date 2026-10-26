package com.civicpulse.dto.notification;

import com.civicpulse.entity.Notification;
import java.time.Instant;

public record NotificationResponse(Long id, Long issueId, String title, String message,
                                   boolean read, Instant createdAt, Instant readAt) {
    public static NotificationResponse from(Notification notification) {
        return new NotificationResponse(notification.getId(),
            notification.getIssue() == null ? null : notification.getIssue().getId(),
            notification.getTitle(), notification.getMessage(), notification.getReadAt() != null,
            notification.getCreatedAt(), notification.getReadAt());
    }
}
