package com.arerti.portal.dto;

import com.arerti.portal.entity.RegistrationAssignment;
import java.util.List;

public record RegistrationAssignmentResponse(
        Long id,
        Long teacherId,
        String teacherName,
        String teacherEmployeeId,
        String allowedGrades,
        List<Integer> allowedGradeList
) {
    public static RegistrationAssignmentResponse from(RegistrationAssignment a) {
        return new RegistrationAssignmentResponse(
                a.getId(),
                a.getTeacher().getId(),
                a.getTeacher().getUser().getFullName(),
                a.getTeacher().getEmployeeId(),
                a.getAllowedGrades(),
                a.getAllowedGradeList()
        );
    }
}
