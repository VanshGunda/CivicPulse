package com.civicpulse.controller;

import com.civicpulse.dto.issue.*;
import com.civicpulse.entity.User;
import com.civicpulse.enums.IssueCategory;
import com.civicpulse.enums.IssueStatus;
import com.civicpulse.enums.Priority;
import com.civicpulse.security.CurrentUserService;
import com.civicpulse.service.IssueService;
import com.civicpulse.service.PageableSupport;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/issues")
public class IssueController {
    private final IssueService issueService;
    private final CurrentUserService currentUserService;

    public IssueController(IssueService issueService, CurrentUserService currentUserService) {
        this.issueService = issueService;
        this.currentUserService = currentUserService;
    }

    @PostMapping
    public IssueCreateResult create(@Valid @RequestBody IssueCreateRequest request) {
        return issueService.create(request, currentUserService.getCurrentUser());
    }

    @GetMapping
    public Page<IssueResponse> search(
            @RequestParam(required = false) IssueStatus status,
            @RequestParam(required = false) IssueCategory category,
            @RequestParam(required = false) Priority priority,
            @RequestParam(required = false) String q,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return issueService.search(status, category, priority, q, PageableSupport.cap(pageable, 100, "createdAt"));
    }

    @GetMapping("/mine")
    public Page<IssueResponse> mine(@PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return issueService.mine(currentUserService.getCurrentUser(), PageableSupport.cap(pageable, 100, "createdAt"));
    }

    @GetMapping("/assigned")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public Page<IssueResponse> assigned(@PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return issueService.assignedToMe(currentUserService.getCurrentUser(), PageableSupport.cap(pageable, 100, "createdAt"));
    }

    @GetMapping("/duplicate-check")
    public List<DuplicateIssueResponse> duplicateCheck(
            @RequestParam IssueCategory category,
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam(required = false) Integer radiusMeters) {
        return issueService.findPotentialDuplicates(category, latitude, longitude, radiusMeters);
    }

    @GetMapping("/{id}")
    public IssueResponse getById(@PathVariable Long id) { return issueService.getById(id); }

    @PutMapping("/{id}")
    public IssueResponse updateOwnIssue(@PathVariable Long id, @Valid @RequestBody IssueUpdateRequest request) {
        return issueService.updateOwnIssue(id, request, currentUserService.getCurrentUser());
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public IssueResponse updateStatus(@PathVariable Long id, @Valid @RequestBody IssueStatusUpdateRequest request) {
        return issueService.updateStatus(id, request, currentUserService.getCurrentUser());
    }

    @PatchMapping("/{id}/priority")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public IssueResponse updatePriority(@PathVariable Long id, @Valid @RequestBody IssuePriorityUpdateRequest request) {
        return issueService.updatePriority(id, request, currentUserService.getCurrentUser());
    }

    @PatchMapping("/{id}/assignment")
    @PreAuthorize("hasRole('ADMIN')")
    public IssueResponse assign(@PathVariable Long id, @Valid @RequestBody IssueAssignmentRequest request) {
        return issueService.assign(id, request, currentUserService.getCurrentUser());
    }

    @GetMapping("/{id}/history")
    public List<IssueStatusHistoryResponse> history(@PathVariable Long id) { return issueService.history(id); }

    @GetMapping("/{id}/comments")
    public List<IssueCommentResponse> comments(@PathVariable Long id) {
        return issueService.comments(id, currentUserService.getCurrentUser());
    }

    @PostMapping("/{id}/comments")
    public IssueCommentResponse addComment(@PathVariable Long id, @Valid @RequestBody IssueCommentRequest request) {
        return issueService.addComment(id, request, currentUserService.getCurrentUser());
    }

    @PostMapping("/{id}/support")
    public SupportResponse support(@PathVariable Long id) {
        return issueService.support(id, currentUserService.getCurrentUser());
    }

    @DeleteMapping("/{id}/support")
    public SupportResponse removeSupport(@PathVariable Long id) {
        return issueService.removeSupport(id, currentUserService.getCurrentUser());
    }
}
