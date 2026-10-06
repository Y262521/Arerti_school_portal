package com.arerti.portal.repository;

import com.arerti.portal.entity.EnrollmentRecord;
import com.arerti.portal.entity.RegistrationWindow;
import com.arerti.portal.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EnrollmentRecordRepository extends JpaRepository<EnrollmentRecord, Long> {

    boolean existsByStudentAndAcademicYear(Student student, String academicYear);

    Optional<EnrollmentRecord> findByStudentAndAcademicYear(Student student, String academicYear);

    List<EnrollmentRecord> findByAcademicYearAndGradeOrderByCreatedAtDesc(String academicYear, Integer grade);

    List<EnrollmentRecord> findByAcademicYearOrderByCreatedAtDesc(String academicYear);

    List<EnrollmentRecord> findByWindowOrderByCreatedAtDesc(RegistrationWindow window);
}
