package com.arerti.portal.dto;

import com.arerti.portal.entity.ClassSubjectAssignment;

import java.time.Instant;

public record ClassSubjectAssignmentResponse(
        Long id,
        Long sectionId,
        String sectionLabel,
        Long subjectId,
        String subjectName,
        String subjectCode,
        Long teacherId,
        String teacherName,
        String teacherEmployeeId,
        String academicYear,
        boolean archived,
        Instant createdAt
) {
    public static ClassSubjectAssignmentResponse from(ClassSubjectAssignment a) {
        return new ClassSubjectAssignmentResponse(
                a.getId(),
                a.getSection().getId(),
                "Grade " + a.getSection().getGrade() + " - " + a.getSection().getSection(),
                a.getSubject().getId(),
                a.getSubject().getName(),
                a.getSubject().getCode(),
                a.getTeacher() != null ? a.getTeacher().getId() : null,
                a.getTeacher() != null ? a.getTeacher().getUser().getFullName() : null,
                a.getTeacher() != null ? a.getTeacher().getEmployeeId() : null,
                a.getAcademicYear(),
                a.isArchived(),
                a.getCreatedAt()
        );
    }
}
