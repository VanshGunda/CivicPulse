package com.civicpulse.repository;

import com.civicpulse.entity.Issue;
import com.civicpulse.enums.IssueCategory;
import com.civicpulse.enums.IssueStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface IssueRepository extends JpaRepository<Issue, Long>, JpaSpecificationExecutor<Issue> {
    @Override
    @EntityGraph(attributePaths = {"reporter", "assignee", "department"})
    Page<Issue> findAll(Specification<Issue> spec, Pageable pageable);

    @EntityGraph(attributePaths = {"reporter", "assignee", "department"})
    Optional<Issue> findWithDetailsById(Long id);

    @EntityGraph(attributePaths = {"reporter", "assignee", "department"})
    Page<Issue> findByReporter_Id(Long reporterId, Pageable pageable);

    @EntityGraph(attributePaths = {"reporter", "assignee", "department"})
    Page<Issue> findByAssignee_Id(Long assigneeId, Pageable pageable);

    @EntityGraph(attributePaths = {"reporter", "assignee", "department"})
    Page<Issue> findByCategoryAndStatusInAndLatitudeIsNotNullAndLongitudeIsNotNull(
        IssueCategory category, Collection<IssueStatus> statuses, Pageable pageable);

    long countByStatus(IssueStatus status);
    long countByStatusIn(Collection<IssueStatus> statuses);
    long countByDueAtBeforeAndStatusIn(Instant time, Collection<IssueStatus> statuses);

    List<Issue> findTop1000ByStatusAndResolvedAtIsNotNullOrderByResolvedAtDesc(IssueStatus status);

    @Query("select i.category as category, count(i.id) as totalCount from Issue i group by i.category")
    List<CategoryCountProjection> countGroupedByCategory();

    @Query("select i.status as status, count(i.id) as totalCount from Issue i group by i.status")
    List<StatusCountProjection> countGroupedByStatus();

    interface StatusCountProjection {
        IssueStatus getStatus();
        Long getTotalCount();
    }
}
