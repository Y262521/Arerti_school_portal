package com.arerti.portal.repository;

import com.arerti.portal.entity.GradeSection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface GradeSectionRepository extends JpaRepository<GradeSection, Long> {
    List<GradeSection> findByAcademicYear(String academicYear);
    boolean existsByGradeAndSectionAndAcademicYear(Integer grade, String section, String academicYear);

    @Query("SELECT COUNT(s) FROM Student s WHERE s.sectionId = :sectionId")
    long countStudentsBySectionId(Long sectionId);
}
