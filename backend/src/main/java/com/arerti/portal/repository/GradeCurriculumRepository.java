package com.arerti.portal.repository;

import com.arerti.portal.entity.GradeCurriculum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface GradeCurriculumRepository extends JpaRepository<GradeCurriculum, Long> {

    /** All subjects for a grade with no stream (Grade 9 & 10) */
    List<GradeCurriculum> findByGradeAndStreamIsNullOrderBySortOrderAsc(Integer grade);

    /** All subjects for a grade + specific stream (Grade 11 & 12) */
    List<GradeCurriculum> findByGradeAndStreamOrderBySortOrderAsc(Integer grade, String stream);

    /** All entries for a grade (any stream) */
    List<GradeCurriculum> findByGradeOrderBySortOrderAsc(Integer grade);

    /** All entries for a grade + stream (null = no stream) */
    @Query("SELECT c FROM GradeCurriculum c WHERE c.grade = :grade " +
           "AND (:stream IS NULL AND c.stream IS NULL OR c.stream = :stream) " +
           "ORDER BY c.sortOrder ASC")
    List<GradeCurriculum> findByGradeAndStreamOrNull(Integer grade, String stream);

    boolean existsByGradeAndStreamAndSubjectId(Integer grade, String stream, Long subjectId);

    void deleteByGradeAndStreamAndSubjectId(Integer grade, String stream, Long subjectId);

    // Backward compat for existing code
    default List<GradeCurriculum> findByGradeOrderBySortOrderAscCompat(Integer grade, String stream) {
        if (grade >= 11 && stream != null) {
            return findByGradeAndStreamOrderBySortOrderAsc(grade, stream);
        }
        return findByGradeAndStreamIsNullOrderBySortOrderAsc(grade);
    }
}
