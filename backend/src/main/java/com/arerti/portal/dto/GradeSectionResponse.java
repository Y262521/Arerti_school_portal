package com.arerti.portal.dto;

import com.arerti.portal.entity.GradeSection;

public record GradeSectionResponse(
        Long id,
        Integer grade,
        String section,
        String academicYear,
        Long homeroomTeacherId,
        String homeroomTeacherName,
        Integer maxCapacity,
        String stream,   // null for G9-10, NATURAL_SCIENCE or SOCIAL_SCIENCE for G11-12
        long studentCount
) {
    public static GradeSectionResponse from(GradeSection gs, long studentCount) {
        return new GradeSectionResponse(
                gs.getId(), gs.getGrade(), gs.getSection(), gs.getAcademicYear(),
                gs.getHomeroomTeacher() != null ? gs.getHomeroomTeacher().getId() : null,
                gs.getHomeroomTeacher() != null ? gs.getHomeroomTeacher().getUser().getFullName() : null,
                gs.getMaxCapacity(), gs.getStream(), studentCount
        );
    }
}
