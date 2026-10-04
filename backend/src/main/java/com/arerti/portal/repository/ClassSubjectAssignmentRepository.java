package com.arerti.portal.repository;

import com.arerti.portal.entity.ClassSubjectAssignment;
import com.arerti.portal.entity.GradeSection;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClassSubjectAssignmentRepository extends JpaRepository<ClassSubjectAssignment, Long> {

    List<ClassSubjectAssignment> findBySectionOrderBySubjectNameAsc(GradeSection section);

    List<ClassSubjectAssignment> findBySectionAndArchivedFalse(GradeSection section);

    Optional<ClassSubjectAssignment> findBySectionAndSubjectId(GradeSection section, Long subjectId);

    boolean existsBySectionAndSubjectId(GradeSection section, Long subjectId);

    /** All active assignments for an academic year — used for year-end rollover */
    List<ClassSubjectAssignment> findByAcademicYearAndArchivedFalse(String academicYear);
}
