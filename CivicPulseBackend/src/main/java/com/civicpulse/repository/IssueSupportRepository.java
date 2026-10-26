package com.civicpulse.repository;

import com.civicpulse.entity.IssueSupport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Collection;
import java.util.List;

public interface IssueSupportRepository extends JpaRepository<IssueSupport, Long> {
    boolean existsByIssue_IdAndUser_Id(Long issueId, Long userId);
    long countByIssue_Id(Long issueId);
    void deleteByIssue_IdAndUser_Id(Long issueId, Long userId);

    @Query("select s.issue.id as issueId, count(s.id) as supportCount from IssueSupport s where s.issue.id in :issueIds group by s.issue.id")
    List<SupportCountProjection> countSupportsByIssueIds(@Param("issueIds") Collection<Long> issueIds);
}
