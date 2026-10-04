package com.arerti.portal.dto;

import com.arerti.portal.entity.Teacher;

import java.time.LocalDate;

public record TeacherResponse(
        Long id,
        String employeeId,
        Long userId,
        String username,
        String fullName,
        String email,
        String phone,
        String qualification,
        String specialization,
        LocalDate hireDate,
        String generatedUsername,
        String generatedPassword
) {
    public static TeacherResponse from(Teacher t) {
        return new TeacherResponse(
                t.getId(), t.getEmployeeId(), t.getUser().getId(),
                t.getUser().getUsername(), t.getUser().getFullName(),
                t.getUser().getEmail(), t.getUser().getPhone(),
                t.getQualification(), t.getSpecialization(), t.getHireDate(),
                null, null
        );
    }

    public static TeacherResponse fromWithCredentials(Teacher t,
                                                       String genUsername, String genPassword) {
        return new TeacherResponse(
                t.getId(), t.getEmployeeId(), t.getUser().getId(),
                t.getUser().getUsername(), t.getUser().getFullName(),
                t.getUser().getEmail(), t.getUser().getPhone(),
                t.getQualification(), t.getSpecialization(), t.getHireDate(),
                genUsername, genPassword
        );
    }
}
