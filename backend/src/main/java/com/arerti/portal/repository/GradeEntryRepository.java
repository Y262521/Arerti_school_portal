package com.arerti.portal.repository;

import com.arerti.portal.entity.GradeEntry;
import com.arerti.portal.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface GradeEntryRepository extends JpaRepository<GradeEntry, Long> {

    List<GradeEntry> findByStudentAndAcademicYear(Student student, String academicYear);

    List<GradeEntry> findByStudentAndTermAndAcademicYear(Student student, Integer term, String academicYear);

    List<GradeEntry> findByStudent_SectionIdAndTermAndAcademicYear(Long sectionId, Integer term, String academicYear);

    Optional<GradeEntry> findByStudentIdAndSubjectIdAndTermAndAcademicYear(
            Long studentId, Long subjectId, Integer term, String academicYear);

    @Query("SELECT AVG(g.score) FROM GradeEntry g WHERE g.student = :student AND g.academicYear = :year")
    Double findAverageByStudentAndYear(Student student, String year);
}
