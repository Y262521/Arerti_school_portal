package com.arerti.portal.dto;

import com.arerti.portal.entity.Teacher;
import java.time.LocalDate;

public record TeacherResponse(
        Long id,
        String employeeId,
        Long userId,
        String username,
        String fullName,
        String firstName,
        String fatherName,
        String grandfatherName,
        String gender,
        String email,
        String phone,
        String qualification,
        String specialization,
        LocalDate hireDate,
        String photoUrl,
        String qualificationCertUrl,
        String idDocUrl,
        String generatedUsername,
        String generatedPassword
) {
    public static TeacherResponse from(Teacher t) {
        return new TeacherResponse(
                t.getId(), t.getEmployeeId(), t.getUser().getId(),
                t.getUser().getUsername(), t.getUser().getFullName(),
                t.getFirstName(), t.getFatherName(), t.getGrandfatherName(),
                t.getGender(),
                t.getUser().getEmail(), t.getUser().getPhone(),
                t.getQualification(), t.getSpecialization(), t.getHireDate(),
                t.getPhotoUrl(), t.getQualificationCertUrl(), t.getIdDocUrl(),
                null, null
        );
    }

    public static TeacherResponse fromWithCredentials(Teacher t,
                                                       String genUsername, String genPassword) {
        return new TeacherResponse(
                t.getId(), t.getEmployeeId(), t.getUser().getId(),
                t.getUser().getUsername(), t.getUser().getFullName(),
                t.getFirstName(), t.getFatherName(), t.getGrandfatherName(),
                t.getGender(),
                t.getUser().getEmail(), t.getUser().getPhone(),
                t.getQualification(), t.getSpecialization(), t.getHireDate(),
                t.getPhotoUrl(), t.getQualificationCertUrl(), t.getIdDocUrl(),
                genUsername, genPassword
        );
    }
}
