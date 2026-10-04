package com.arerti.portal.dto;

import com.arerti.portal.entity.RegradePermission;

import java.time.Instant;

public record RegradePermissionResponse(
        Long id,
        Long teacherId,
        String teacherName,
        String teacherEmployeeId,
        Long studentId,
        String studentName,
        String studentUid,
        Long subjectId,
        String subjectName,
        Long sectionId,
        String sectionLabel,
        Integer term,
        String academicYear,
        String reason,
        String adminNote,
        String status,
        String grantedBy,
        Instant createdAt,
        Instant resolvedAt
) {
    public static RegradePermissionResponse from(RegradePermission r) {
        return new RegradePermissionResponse(
                r.getId(),
                r.getTeacher().getId(),
                r.getTeacher().getUser().getFullName(),
                r.getTeacher().getEmployeeId(),
                r.getStudent().getId(),
                r.getStudent().getUser().getFullName(),
                r.getStudent().getStudentUid(),
                r.getSubject().getId(),
                r.getSubject().getName(),
                r.getSection().getId(),
                "Grade " + r.getSection().getGrade() + " - " + r.getSection().getSection(),
                r.getTerm(),
                r.getAcademicYear(),
                r.getReason(),
                r.getAdminNote(),
                r.getStatus().name(),
                r.getGrantedBy(),
                r.getCreatedAt(),
                r.getResolvedAt()
        );
    }
}
