package com.arerti.portal.dto;

import com.arerti.portal.entity.Subject;

public record SubjectResponse(Long id, String name, String code, String applicableGrades) {
    public static SubjectResponse from(Subject s) {
        return new SubjectResponse(s.getId(), s.getName(), s.getCode(), s.getApplicableGrades());
    }
}
