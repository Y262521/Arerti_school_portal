package com.arerti.portal.repository;

import com.arerti.portal.entity.GradeCurriculum;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GradeCurriculumRepository extends JpaRepository<GradeCurriculum, Long> {

    /** All subjects in a grade's curriculum, ordered by sortOrder */
    List<GradeCurriculum> findByGradeOrderBySortOrderAsc(Integer grade);

    boolean existsByGradeAndSubjectId(Integer grade, Long subjectId);

    void deleteByGradeAndSubjectId(Integer grade, Long subjectId);
}
