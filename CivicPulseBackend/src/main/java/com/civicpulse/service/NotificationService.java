package com.civicpulse.service;

import com.civicpulse.dto.notification.NotificationResponse;
import com.civicpulse.entity.Issue;
import com.civicpulse.entity.Notification;
import com.civicpulse.entity.User;
import com.civicpulse.exception.ResourceNotFoundException;
import com.civicpulse.repository.NotificationRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {
    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) { this.notificationRepository = notificationRepository; }

    @Transactional
    public void notifyUser(User recipient, Issue issue, String title, String message) {
        if (recipient == null) return;
        Notification notification = new Notification();
        notification.setRecipient(recipient);
        notification.setIssue(issue);
        notification.setTitle(title);
        notification.setMessage(message);
        notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public Page<NotificationResponse> list(User user, Pageable pageable) {
        return notificationRepository.findByRecipient_IdOrderByCreatedAtDesc(user.getId(), pageable)
            .map(NotificationResponse::from);
    }

    @Transactional(readOnly = true)
    public long unreadCount(User user) {
        return notificationRepository.countByRecipient_IdAndReadAtIsNull(user.getId());
    }

    @Transactional
    public NotificationResponse markRead(Long notificationId, User user) {
        Notification notification = notificationRepository.findByIdAndRecipient_Id(notificationId, user.getId())
            .orElseThrow(() -> new ResourceNotFoundException("Notification not found: " + notificationId));
        if (notification.getReadAt() == null) notification.setReadAt(java.time.Instant.now());
        return NotificationResponse.from(notification);
    }
}
