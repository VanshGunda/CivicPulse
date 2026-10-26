package com.civicpulse.repository;

import com.civicpulse.entity.IssueComment;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface IssueCommentRepository extends JpaRepository<IssueComment, Long> {
    @EntityGraph(attributePaths = {"author"})
    List<IssueComment> findByIssue_IdOrderByCreatedAtAsc(Long issueId);
}
