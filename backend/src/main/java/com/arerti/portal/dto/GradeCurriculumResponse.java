package com.arerti.portal.dto;

import com.arerti.portal.entity.GradeCurriculum;

public record GradeCurriculumResponse(
        Long id,
        Integer grade,
        Long subjectId,
        String subjectName,
        String subjectCode,
        Integer sortOrder
) {
    public static GradeCurriculumResponse from(GradeCurriculum c) {
        return new GradeCurriculumResponse(
                c.getId(),
                c.getGrade(),
                c.getSubject().getId(),
                c.getSubject().getName(),
                c.getSubject().getCode(),
                c.getSortOrder()
        );
    }
}
