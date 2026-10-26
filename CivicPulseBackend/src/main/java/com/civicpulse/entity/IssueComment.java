package com.civicpulse.entity;

import com.civicpulse.enums.CommentVisibility;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "issue_comments", indexes = @Index(name = "idx_comments_issue_created", columnList = "issue_id, created_at"))
public class IssueComment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "issue_id", nullable = false)
    private Issue issue;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(nullable = false, length = 2000)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CommentVisibility visibility = CommentVisibility.PUBLIC;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() { createdAt = Instant.now(); }

    public Long getId() { return id; }
    public Issue getIssue() { return issue; }
    public void setIssue(Issue issue) { this.issue = issue; }
    public User getAuthor() { return author; }
    public void setAuthor(User author) { this.author = author; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public CommentVisibility getVisibility() { return visibility; }
    public void setVisibility(CommentVisibility visibility) { this.visibility = visibility; }
    public Instant getCreatedAt() { return createdAt; }
}
