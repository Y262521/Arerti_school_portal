package com.arerti.portal.repository;

import com.arerti.portal.entity.RegradePermission;
import com.arerti.portal.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface RegradePermissionRepository extends JpaRepository<RegradePermission, Long> {

    List<RegradePermission> findAllByOrderByCreatedAtDesc();

    List<RegradePermission> findByStatusOrderByCreatedAtDesc(RegradePermission.RegradeStatus status);

    List<RegradePermission> findByTeacher_IdOrderByCreatedAtDesc(Long teacherId);

    /**
     * Check if there is an active APPROVED permission for this
     * teacher + student + subject + term + year (student-scoped).
     */
    @Query("SELECT r FROM RegradePermission r WHERE r.teacher.id = :teacherId " +
           "AND r.student.id = :studentId " +
           "AND r.subject.id = :subjectId AND r.term = :term " +
           "AND r.academicYear = :academicYear AND r.status = 'APPROVED'")
    Optional<RegradePermission> findActiveByTeacherAndStudentAndSubjectAndTerm(
            Long teacherId, Long studentId, Long subjectId, Integer term, String academicYear);

    /** Prevent duplicate pending requests for the same student+subject */
    boolean existsByTeacher_IdAndStudent_IdAndSubject_IdAndTermAndAcademicYearAndStatus(
            Long teacherId, Long studentId, Long subjectId, Integer term, String academicYear,
            RegradePermission.RegradeStatus status);
}
