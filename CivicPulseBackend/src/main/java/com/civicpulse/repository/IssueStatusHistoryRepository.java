package com.civicpulse.repository;

import com.civicpulse.entity.IssueStatusHistory;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface IssueStatusHistoryRepository extends JpaRepository<IssueStatusHistory, Long> {
    @EntityGraph(attributePaths = {"changedBy"})
    List<IssueStatusHistory> findByIssue_IdOrderByCreatedAtAsc(Long issueId);
}
