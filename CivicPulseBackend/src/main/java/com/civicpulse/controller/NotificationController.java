package com.civicpulse.controller;

import com.civicpulse.dto.notification.NotificationResponse;
import com.civicpulse.security.CurrentUserService;
import com.civicpulse.service.NotificationService;
import com.civicpulse.service.PageableSupport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationService notificationService;
    private final CurrentUserService currentUserService;

    public NotificationController(NotificationService notificationService, CurrentUserService currentUserService) {
        this.notificationService = notificationService;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    public Page<NotificationResponse> list(@PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return notificationService.list(currentUserService.getCurrentUser(), PageableSupport.cap(pageable, 100, "createdAt"));
    }

    @GetMapping("/unread-count")
    public Map<String, Long> unreadCount() {
        return Map.of("unreadCount", notificationService.unreadCount(currentUserService.getCurrentUser()));
    }

    @PatchMapping("/{id}/read")
    public NotificationResponse markRead(@PathVariable Long id) {
        return notificationService.markRead(id, currentUserService.getCurrentUser());
    }
}
