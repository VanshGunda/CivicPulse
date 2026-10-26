package com.civicpulse.service;

import com.civicpulse.dto.issue.*;
import com.civicpulse.entity.*;
import com.civicpulse.enums.CommentVisibility;
import com.civicpulse.enums.IssueCategory;
import com.civicpulse.enums.IssueStatus;
import com.civicpulse.enums.Priority;
import com.civicpulse.enums.Role;
import com.civicpulse.exception.ConflictException;
import com.civicpulse.exception.ResourceNotFoundException;
import com.civicpulse.repository.*;

import jakarta.persistence.criteria.Predicate;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class IssueService {

    private static final List<IssueStatus> ACTIVE_STATUSES = List.of(
        IssueStatus.SUBMITTED,
        IssueStatus.VERIFIED,
        IssueStatus.ASSIGNED,
        IssueStatus.IN_PROGRESS
    );

    private final IssueRepository issueRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final IssueStatusHistoryRepository historyRepository;
    private final IssueSupportRepository supportRepository;
    private final IssueCommentRepository commentRepository;
    private final NotificationService notificationService;

    @Value("${app.issues.duplicate-radius-meters:500}")
    private int defaultDuplicateRadiusMeters;

    public IssueService(
            IssueRepository issueRepository,
            UserRepository userRepository,
            DepartmentRepository departmentRepository,
            IssueStatusHistoryRepository historyRepository,
            IssueSupportRepository supportRepository,
            IssueCommentRepository commentRepository,
            NotificationService notificationService) {

        this.issueRepository = issueRepository;
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.historyRepository = historyRepository;
        this.supportRepository = supportRepository;
        this.commentRepository = commentRepository;
        this.notificationService = notificationService;
    }

    // =========================================================
    // CREATE ISSUE
    // =========================================================

    @Transactional
    public IssueCreateResult create(
            IssueCreateRequest request,
            User reporter) {

        validateCoordinates(
            request.latitude(),
            request.longitude()
        );

        validatePhotoUrl(request.photoUrl());

        List<DuplicateIssueResponse> duplicates =
            findPotentialDuplicatesInternal(
                request.category(),
                request.latitude(),
                request.longitude(),
                defaultDuplicateRadiusMeters
            );

        Issue issue = new Issue();

        issue.setTitle(request.title().trim());
        issue.setDescription(request.description().trim());
        issue.setCategory(request.category());
        issue.setAddress(request.address().trim());
        issue.setLatitude(request.latitude());
        issue.setLongitude(request.longitude());
        issue.setPhotoUrl(normalizeOptional(request.photoUrl()));
        issue.setReporter(reporter);
        issue.setStatus(IssueStatus.SUBMITTED);
        issue.setPriority(Priority.MEDIUM);

        issue.setDueAt(
            Instant.now().plus(
                Duration.ofHours(slaHours(Priority.MEDIUM))
            )
        );

        if (request.departmentId() != null) {

            Department department =
                departmentRepository.findById(request.departmentId())
                    .orElseThrow(() ->
                        new ResourceNotFoundException(
                            "Department not found: "
                                + request.departmentId()
                        )
                    );

            if (!department.isActive()) {
                throw new ConflictException(
                    "The selected department is inactive"
                );
            }

            issue.setDepartment(department);
        }

        issue = issueRepository.save(issue);

        recordHistory(
            issue,
            reporter,
            null,
            IssueStatus.SUBMITTED,
            "Issue submitted"
        );

        return new IssueCreateResult(
            toResponse(issue, 0L),
            duplicates
        );
    }

    // =========================================================
    // SEARCH ISSUES
    // =========================================================

    @Transactional(readOnly = true)
    public Page<IssueResponse> search(
            IssueStatus status,
            IssueCategory category,
            Priority priority,
            String query,
            Pageable pageable) {

        Specification<Issue> specification =
            (root, criteriaQuery, cb) -> {

                List<Predicate> predicates = new ArrayList<>();

                if (status != null) {
                    predicates.add(
                        cb.equal(root.get("status"), status)
                    );
                }

                if (category != null) {
                    predicates.add(
                        cb.equal(root.get("category"), category)
                    );
                }

                if (priority != null) {
                    predicates.add(
                        cb.equal(root.get("priority"), priority)
                    );
                }

                if (query != null && !query.isBlank()) {

                    String pattern =
                        "%" + query.trim().toLowerCase() + "%";

                    predicates.add(
                        cb.or(
                            cb.like(
                                cb.lower(root.get("title")),
                                pattern
                            ),
                            cb.like(
                                cb.lower(root.get("description")),
                                pattern
                            ),
                            cb.like(
                                cb.lower(root.get("address")),
                                pattern
                            )
                        )
                    );
                }

                return cb.and(
                    predicates.toArray(new Predicate[0])
                );
            };

        Page<Issue> page =
            issueRepository.findAll(specification, pageable);

        Map<Long, Long> supportCounts =
            loadSupportCounts(page.getContent());

        return page.map(issue ->
            toResponse(
                issue,
                supportCounts.getOrDefault(issue.getId(), 0L)
            )
        );
    }

    // =========================================================
    // CURRENT USER'S ISSUES
    // =========================================================

    @Transactional(readOnly = true)
    public Page<IssueResponse> mine(
            User user,
            Pageable pageable) {

        Page<Issue> page =
            issueRepository.findByReporter_Id(
                user.getId(),
                pageable
            );

        Map<Long, Long> counts =
            loadSupportCounts(page.getContent());

        return page.map(issue ->
            toResponse(
                issue,
                counts.getOrDefault(issue.getId(), 0L)
            )
        );
    }

    // =========================================================
    // ISSUES ASSIGNED TO CURRENT STAFF MEMBER
    // =========================================================

    @Transactional(readOnly = true)
    public Page<IssueResponse> assignedToMe(
            User user,
            Pageable pageable) {

        Page<Issue> page =
            issueRepository.findByAssignee_Id(
                user.getId(),
                pageable
            );

        Map<Long, Long> counts =
            loadSupportCounts(page.getContent());

        return page.map(issue ->
            toResponse(
                issue,
                counts.getOrDefault(issue.getId(), 0L)
            )
        );
    }

    // =========================================================
    // GET ISSUE BY ID
    // =========================================================

    @Transactional(readOnly = true)
    public IssueResponse getById(Long id) {

        Issue issue = findIssue(id);

        return toResponse(
            issue,
            supportRepository.countByIssue_Id(id)
        );
    }

    // =========================================================
    // UPDATE OWN ISSUE
    // =========================================================

    @Transactional
    public IssueResponse updateOwnIssue(
            Long id,
            IssueUpdateRequest request,
            User actor) {

        Issue issue = findIssue(id);

        if (!issue.getReporter().getId().equals(actor.getId())) {
            throw new AccessDeniedException(
                "You can only edit your own report"
            );
        }

        if (issue.getStatus() != IssueStatus.SUBMITTED) {
            throw new ConflictException(
                "Only submitted reports can be edited"
            );
        }

        validateCoordinates(
            request.latitude(),
            request.longitude()
        );

        validatePhotoUrl(request.photoUrl());

        issue.setTitle(request.title().trim());
        issue.setDescription(request.description().trim());
        issue.setCategory(request.category());
        issue.setAddress(request.address().trim());
        issue.setLatitude(request.latitude());
        issue.setLongitude(request.longitude());
        issue.setPhotoUrl(normalizeOptional(request.photoUrl()));

        Issue savedIssue = issueRepository.save(issue);

        return toResponse(
            savedIssue,
            supportRepository.countByIssue_Id(id)
        );
    }

    // =========================================================
    // UPDATE ISSUE STATUS
    // =========================================================

    @Transactional
    public IssueResponse updateStatus(
            Long id,
            IssueStatusUpdateRequest request,
            User actor) {

        Issue issue = findIssue(id);

        IssueStatus previous = issue.getStatus();
        IssueStatus next = request.status();

        if (previous == next) {
            throw new ConflictException(
                "The issue already has this status"
            );
        }

        validateTransition(
            previous,
            next,
            actor.getRole()
        );

        if (next == IssueStatus.REJECTED
                && (request.comment() == null
                || request.comment().isBlank())) {

            throw new ConflictException(
                "A reason is required when rejecting an issue"
            );
        }

        issue.setStatus(next);

        if (next == IssueStatus.RESOLVED) {
            issue.setResolvedAt(Instant.now());
        } else if (previous == IssueStatus.RESOLVED) {
            issue.setResolvedAt(null);
        }

        issue = issueRepository.save(issue);

        recordHistory(
            issue,
            actor,
            previous,
            next,
            normalizeOptional(request.comment())
        );

        if (issue.getReporter() != null
                && !issue.getReporter().getId().equals(actor.getId())) {

            notificationService.notifyUser(
                issue.getReporter(),
                issue,
                "Issue status updated",
                "Your report #" + issue.getId()
                    + " is now "
                    + next.name().replace('_', ' ').toLowerCase()
                    + "."
            );
        }

        return toResponse(
            issue,
            supportRepository.countByIssue_Id(id)
        );
    }

    // =========================================================
    // UPDATE ISSUE PRIORITY
    // =========================================================

    @Transactional
    public IssueResponse updatePriority(
            Long id,
            IssuePriorityUpdateRequest request,
            User actor) {

        Issue issue = findIssue(id);

        if (issue.getStatus() == IssueStatus.RESOLVED
                || issue.getStatus() == IssueStatus.REJECTED) {

            throw new ConflictException(
                "Priority cannot be changed for a resolved or rejected issue"
            );
        }

        Priority oldPriority = issue.getPriority();

        issue.setPriority(request.priority());

        issue.setDueAt(
            Instant.now().plus(
                Duration.ofHours(slaHours(request.priority()))
            )
        );

        issue = issueRepository.save(issue);

        if (oldPriority != request.priority()) {

            notificationService.notifyUser(
                issue.getReporter(),
                issue,
                "Issue priority updated",
                "Priority for report #" + issue.getId()
                    + " changed from " + oldPriority
                    + " to " + request.priority() + "."
            );
        }

        return toResponse(
            issue,
            supportRepository.countByIssue_Id(id)
        );
    }

    // =========================================================
    // ASSIGN ISSUE TO STAFF
    // =========================================================

    @Transactional
    public IssueResponse assign(
            Long id,
            IssueAssignmentRequest request,
            User actor) {

        Issue issue = findIssue(id);

        if (!EnumSet.of(
                IssueStatus.SUBMITTED,
                IssueStatus.VERIFIED,
                IssueStatus.ASSIGNED
            ).contains(issue.getStatus())) {

            throw new ConflictException(
                "Only submitted, verified, or already assigned issues can be assigned"
            );
        }

        User assignee =
            userRepository.findById(request.assigneeId())
                .orElseThrow(() ->
                    new ResourceNotFoundException(
                        "Assignee not found: " + request.assigneeId()
                    )
                );

        if (!assignee.isEnabled()
                || assignee.getRole() != Role.STAFF) {

            throw new ConflictException(
                "The assignee must be an enabled staff member"
            );
        }

        if (request.departmentId() != null) {

            Department department =
                departmentRepository.findById(request.departmentId())
                    .orElseThrow(() ->
                        new ResourceNotFoundException(
                            "Department not found: "
                                + request.departmentId()
                        )
                    );

            if (!department.isActive()) {
                throw new ConflictException(
                    "The selected department is inactive"
                );
            }

            issue.setDepartment(department);
        }

        IssueStatus previous = issue.getStatus();

        issue.setAssignee(assignee);

        if (previous != IssueStatus.ASSIGNED) {
            issue.setStatus(IssueStatus.ASSIGNED);
        }

        issue = issueRepository.save(issue);

        if (previous != IssueStatus.ASSIGNED) {

            recordHistory(
                issue,
                actor,
                previous,
                IssueStatus.ASSIGNED,
                "Issue assigned to " + assignee.getName()
            );

        } else {

            recordHistory(
                issue,
                actor,
                IssueStatus.ASSIGNED,
                IssueStatus.ASSIGNED,
                "Assignment changed to " + assignee.getName()
            );
        }

        if (!assignee.getId().equals(actor.getId())) {

            notificationService.notifyUser(
                assignee,
                issue,
                "Issue assigned to you",
                "You have been assigned report #"
                    + issue.getId() + ": " + issue.getTitle()
            );
        }

        return toResponse(
            issue,
            supportRepository.countByIssue_Id(id)
        );
    }

    // =========================================================
    // ISSUE STATUS HISTORY
    // =========================================================

    @Transactional(readOnly = true)
    public List<IssueStatusHistoryResponse> history(
            Long issueId) {

        ensureIssueExists(issueId);

        return historyRepository
            .findByIssue_IdOrderByCreatedAtAsc(issueId)
            .stream()
            .map(item ->
                new IssueStatusHistoryResponse(
                    item.getId(),
                    item.getFromStatus(),
                    item.getToStatus(),
                    item.getComment(),
                    item.getChangedBy().getId(),
                    item.getChangedBy().getName(),
                    item.getCreatedAt()
                )
            )
            .toList();
    }

    // =========================================================
    // GET ISSUE COMMENTS
    // =========================================================

    @Transactional(readOnly = true)
    public List<IssueCommentResponse> comments(
            Long issueId,
            User viewer) {

        ensureIssueExists(issueId);

        boolean canSeeInternal =
            viewer.getRole() == Role.ADMIN
                || viewer.getRole() == Role.STAFF;

        return commentRepository
            .findByIssue_IdOrderByCreatedAtAsc(issueId)
            .stream()
            .filter(comment ->
                canSeeInternal
                    || comment.getVisibility() == CommentVisibility.PUBLIC
            )
            .map(this::toCommentResponse)
            .toList();
    }

    // =========================================================
    // ADD COMMENT
    // =========================================================

    @Transactional
    public IssueCommentResponse addComment(
            Long issueId,
            IssueCommentRequest request,
            User author) {

        Issue issue = findIssue(issueId);

        if (request.internal()
                && author.getRole() != Role.ADMIN
                && author.getRole() != Role.STAFF) {

            throw new AccessDeniedException(
                "Only staff can add internal notes"
            );
        }

        IssueComment comment = new IssueComment();

        comment.setIssue(issue);
        comment.setAuthor(author);
        comment.setMessage(request.message().trim());

        comment.setVisibility(
            request.internal()
                ? CommentVisibility.STAFF_ONLY
                : CommentVisibility.PUBLIC
        );

        comment = commentRepository.save(comment);

        if (!request.internal()
                && issue.getReporter() != null
                && !issue.getReporter().getId().equals(author.getId())) {

            notificationService.notifyUser(
                issue.getReporter(),
                issue,
                "New issue comment",
                "A new comment was added to report #"
                    + issue.getId() + "."
            );
        }

        return toCommentResponse(comment);
    }

    // =========================================================
    // SUPPORT AN ISSUE
    // =========================================================

    @Transactional
    public SupportResponse support(
            Long issueId,
            User user) {

        Issue issue = findIssue(issueId);

        if (!supportRepository.existsByIssue_IdAndUser_Id(
                issueId, user.getId())) {

            IssueSupport support = new IssueSupport();

            support.setIssue(issue);
            support.setUser(user);

            supportRepository.save(support);
        }

        return new SupportResponse(
            issueId,
            supportRepository.countByIssue_Id(issueId),
            true
        );
    }

    // =========================================================
    // REMOVE SUPPORT
    // =========================================================

    @Transactional
    public SupportResponse removeSupport(
            Long issueId,
            User user) {

        ensureIssueExists(issueId);

        supportRepository.deleteByIssue_IdAndUser_Id(
            issueId,
            user.getId()
        );

        return new SupportResponse(
            issueId,
            supportRepository.countByIssue_Id(issueId),
            false
        );
    }

    // =========================================================
    // FIND POTENTIAL DUPLICATES
    // =========================================================

    @Transactional(readOnly = true)
    public List<DuplicateIssueResponse> findPotentialDuplicates(
            IssueCategory category,
            Double latitude,
            Double longitude,
            Integer radiusMeters) {

        validateCoordinates(latitude, longitude);

        if (latitude == null || longitude == null) {
            throw new IllegalArgumentException(
                "Latitude and longitude are required for duplicate checking"
            );
        }

        int radius = radiusMeters == null
            ? defaultDuplicateRadiusMeters
            : radiusMeters;

        if (radius < 50 || radius > 5000) {
            throw new IllegalArgumentException(
                "radiusMeters must be between 50 and 5000"
            );
        }

        return findPotentialDuplicatesInternal(
            category,
            latitude,
            longitude,
            radius
        );
    }

    private List<DuplicateIssueResponse> findPotentialDuplicatesInternal(
            IssueCategory category,
            Double latitude,
            Double longitude,
            int radiusMeters) {

        if (latitude == null
                || longitude == null
                || category == null) {

            return List.of();
        }

        Page<Issue> candidates =
            issueRepository
                .findByCategoryAndStatusInAndLatitudeIsNotNullAndLongitudeIsNotNull(
                    category,
                    ACTIVE_STATUSES,
                    PageRequest.of(
                        0,
                        200,
                        Sort.by(Sort.Direction.DESC, "createdAt")
                    )
                );

        return candidates.getContent()
            .stream()

            // FIX: Math.round converts the calculated double distance
            // to long, matching DistanceCandidate and the response DTO.
            .map(issue ->
                new DistanceCandidate(
                    issue,
                    Math.round(
                        distanceMeters(
                            latitude,
                            longitude,
                            issue.getLatitude(),
                            issue.getLongitude()
                        )
                    )
                )
            )

            .filter(candidate ->
                candidate.distanceMeters() <= radiusMeters
            )

            .sorted(
                Comparator.comparingLong(
                    DistanceCandidate::distanceMeters
                )
            )

            .map(candidate ->
                new DuplicateIssueResponse(
                    candidate.issue().getId(),
                    candidate.issue().getTitle(),
                    candidate.issue().getCategory(),
                    candidate.issue().getStatus(),
                    candidate.issue().getAddress(),
                    candidate.distanceMeters(),
                    candidate.issue().getCreatedAt()
                )
            )
            .toList();
    }

    // =========================================================
    // FIND ISSUE
    // =========================================================

    private Issue findIssue(Long id) {

        return issueRepository.findWithDetailsById(id)
            .orElseThrow(() ->
                new ResourceNotFoundException(
                    "Issue not found: " + id
                )
            );
    }

    private void ensureIssueExists(Long id) {

        if (!issueRepository.existsById(id)) {
            throw new ResourceNotFoundException(
                "Issue not found: " + id
            );
        }
    }

    // =========================================================
    // RECORD STATUS HISTORY
    // =========================================================

    private void recordHistory(
            Issue issue,
            User actor,
            IssueStatus from,
            IssueStatus to,
            String comment) {

        IssueStatusHistory history = new IssueStatusHistory();

        history.setIssue(issue);
        history.setChangedBy(actor);
        history.setFromStatus(from);
        history.setToStatus(to);
        history.setComment(comment);

        historyRepository.save(history);
    }

    // =========================================================
    // VALIDATE STATUS TRANSITIONS
    // =========================================================

    private void validateTransition(
            IssueStatus from,
            IssueStatus to,
            Role role) {

        boolean allowed = switch (from) {

            case SUBMITTED ->
                to == IssueStatus.VERIFIED
                    || to == IssueStatus.REJECTED;

            case VERIFIED ->
                to == IssueStatus.ASSIGNED
                    || to == IssueStatus.IN_PROGRESS
                    || to == IssueStatus.REJECTED;

            case ASSIGNED ->
                to == IssueStatus.IN_PROGRESS
                    || to == IssueStatus.REJECTED;

            case IN_PROGRESS ->
                to == IssueStatus.RESOLVED
                    || to == IssueStatus.REJECTED;

            case RESOLVED ->
                to == IssueStatus.IN_PROGRESS;

            case REJECTED ->
                to == IssueStatus.SUBMITTED
                    && role == Role.ADMIN;
        };

        if (!allowed) {
            throw new ConflictException(
                "Status transition from " + from
                    + " to " + to + " is not allowed"
            );
        }
    }

    // =========================================================
    // SLA HOURS BY PRIORITY
    // =========================================================

    private long slaHours(Priority priority) {

        return switch (priority) {
            case URGENT -> 4;
            case HIGH -> 24;
            case MEDIUM -> 72;
            case LOW -> 168;
        };
    }

    // =========================================================
    // VALIDATE COORDINATES
    // =========================================================

    private void validateCoordinates(
            Double latitude,
            Double longitude) {

        if ((latitude == null) != (longitude == null)) {
            throw new IllegalArgumentException(
                "Latitude and longitude must either both be supplied "
                    + "or both be omitted"
            );
        }

        if (latitude != null
                && (latitude < -90 || latitude > 90)) {

            throw new IllegalArgumentException(
                "Latitude must be between -90 and 90"
            );
        }

        if (longitude != null
                && (longitude < -180 || longitude > 180)) {

            throw new IllegalArgumentException(
                "Longitude must be between -180 and 180"
            );
        }
    }

    // =========================================================
    // VALIDATE PHOTO URL
    // =========================================================

    private void validatePhotoUrl(String photoUrl) {

        if (photoUrl == null || photoUrl.isBlank()) {
            return;
        }

        String normalized = photoUrl.trim().toLowerCase();

        if (!normalized.startsWith("https://")
                && !normalized.startsWith("http://")
                && !normalized.startsWith("/uploads/")) {

            throw new IllegalArgumentException(
                "photoUrl must be an http or https URL "
                    + "or a path under /uploads/"
            );
        }
    }

    private String normalizeOptional(String value) {

        return value == null || value.isBlank()
            ? null
            : value.trim();
    }

    // =========================================================
    // HAVERSINE DISTANCE CALCULATION
    // =========================================================

    private double distanceMeters(
            double lat1,
            double lon1,
            double lat2,
            double lon2) {

        double earthRadius = 6_371_000.0;

        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1))
                * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2)
                * Math.sin(dLon / 2);

        // Protect against floating-point rounding errors.
        a = Math.min(1.0, Math.max(0.0, a));

        return earthRadius
            * 2
            * Math.atan2(
                Math.sqrt(a),
                Math.sqrt(1 - a)
            );
    }

    // =========================================================
    // LOAD SUPPORT COUNTS EFFICIENTLY
    // =========================================================

    private Map<Long, Long> loadSupportCounts(
            Collection<Issue> issues) {

        if (issues.isEmpty()) {
            return Map.of();
        }

        List<Long> ids = issues.stream()
            .map(Issue::getId)
            .toList();

        Map<Long, Long> counts = new HashMap<>();

        for (SupportCountProjection row :
                supportRepository.countSupportsByIssueIds(ids)) {

            counts.put(
                row.getIssueId(),
                row.getSupportCount()
            );
        }

        return counts;
    }

    // =========================================================
    // CONVERT ISSUE ENTITY TO RESPONSE DTO
    // =========================================================

    private IssueResponse toResponse(
            Issue issue,
            long supportCount) {

        return new IssueResponse(
            issue.getId(),
            issue.getTitle(),
            issue.getDescription(),
            issue.getCategory(),
            issue.getStatus(),
            issue.getPriority(),
            issue.getAddress(),
            issue.getLatitude(),
            issue.getLongitude(),
            issue.getPhotoUrl(),

            issue.getReporter().getId(),
            issue.getReporter().getName(),

            issue.getAssignee() == null
                ? null
                : issue.getAssignee().getId(),

            issue.getAssignee() == null
                ? null
                : issue.getAssignee().getName(),

            issue.getDepartment() == null
                ? null
                : issue.getDepartment().getId(),

            issue.getDepartment() == null
                ? null
                : issue.getDepartment().getName(),

            supportCount,
            issue.getDueAt(),
            issue.getResolvedAt(),
            issue.getCreatedAt(),
            issue.getUpdatedAt(),
            issue.getVersion()
        );
    }

    // =========================================================
    // CONVERT COMMENT ENTITY TO RESPONSE DTO
    // =========================================================

    private IssueCommentResponse toCommentResponse(
            IssueComment comment) {

        return new IssueCommentResponse(
            comment.getId(),
            comment.getIssue().getId(),
            comment.getAuthor().getId(),
            comment.getAuthor().getName(),
            comment.getMessage(),
            comment.getVisibility(),
            comment.getCreatedAt()
        );
    }

    // Keep distanceMeters as long because the DTO expects
    // whole metres. Math.round() is applied before construction.
    private record DistanceCandidate(
        Issue issue,
        long distanceMeters
    ) {}
}