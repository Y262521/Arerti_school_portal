package com.arerti.portal.repository;

import com.arerti.portal.entity.GradeSection;
import com.arerti.portal.entity.Teacher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface GradeSectionRepository extends JpaRepository<GradeSection, Long> {
    List<GradeSection> findByAcademicYear(String academicYear);
    boolean existsByGradeAndSectionAndAcademicYear(Integer grade, String section, String academicYear);
    boolean existsByGradeAndSectionAndAcademicYearAndStream(Integer grade, String section, String academicYear, String stream);

    @Query("SELECT COUNT(s) FROM Student s WHERE s.sectionId = :sectionId")
    long countStudentsBySectionId(Long sectionId);

    /** Returns only the classes where this teacher is the homeroom teacher */
    List<GradeSection> findByHomeroomTeacher(Teacher teacher);
}
