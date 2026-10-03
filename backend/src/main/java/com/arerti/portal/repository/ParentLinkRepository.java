package com.arerti.portal.repository;

import com.arerti.portal.entity.ParentLink;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ParentLinkRepository extends JpaRepository<ParentLink, Long> {
    List<ParentLink> findByParentId(Long parentUserId);
    Optional<ParentLink> findByParentIdAndStudentId(Long parentUserId, Long studentId);
    boolean existsByParentIdAndStudentId(Long parentUserId, Long studentId);
}
