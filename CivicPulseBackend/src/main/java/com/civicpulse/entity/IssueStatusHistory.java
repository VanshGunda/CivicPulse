package com.civicpulse.entity;

import com.civicpulse.enums.IssueStatus;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "issue_status_history", indexes = @Index(name = "idx_history_issue_created", columnList = "issue_id, created_at"))
public class IssueStatusHistory {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "issue_id", nullable = false)
    private Issue issue;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "changed_by_id", nullable = false)
    private User changedBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_status", length = 20)
    private IssueStatus fromStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", nullable = false, length = 20)
    private IssueStatus toStatus;

    @Column(length = 1000)
    private String comment;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() { createdAt = Instant.now(); }

    public Long getId() { return id; }
    public Issue getIssue() { return issue; }
    public void setIssue(Issue issue) { this.issue = issue; }
    public User getChangedBy() { return changedBy; }
    public void setChangedBy(User changedBy) { this.changedBy = changedBy; }
    public IssueStatus getFromStatus() { return fromStatus; }
    public void setFromStatus(IssueStatus fromStatus) { this.fromStatus = fromStatus; }
    public IssueStatus getToStatus() { return toStatus; }
    public void setToStatus(IssueStatus toStatus) { this.toStatus = toStatus; }
    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
    public Instant getCreatedAt() { return createdAt; }
}
