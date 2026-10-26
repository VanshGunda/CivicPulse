package com.civicpulse.repository;

import com.civicpulse.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    @EntityGraph(attributePaths = {"issue"})
    Page<Notification> findByRecipient_IdOrderByCreatedAtDesc(Long recipientId, Pageable pageable);
    long countByRecipient_IdAndReadAtIsNull(Long recipientId);
    Optional<Notification> findByIdAndRecipient_Id(Long notificationId, Long recipientId);
}
