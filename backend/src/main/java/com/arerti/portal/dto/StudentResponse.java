package com.arerti.portal.dto;

import com.arerti.portal.entity.Student;

import java.time.LocalDate;

public record StudentResponse(
        Long id,
        String studentUid,
        Long userId,
        String username,
        String fullName,
        String email,
        String phone,
        LocalDate dateOfBirth,
        String gender,
        String parentName,        // renamed from guardianName
        String parentPhone,
        Integer enrollmentYear,
        Long sectionId,
        String sectionLabel,
        // Only set on creation — contains the auto-generated plain-text credentials for admin to share
        String generatedUsername,
        String generatedPassword
) {
    public static StudentResponse from(Student s, String sectionLabel) {
        return new StudentResponse(
                s.getId(),
                s.getStudentUid(),
                s.getUser().getId(),
                s.getUser().getUsername(),
                s.getUser().getFullName(),
                s.getUser().getEmail(),
                s.getUser().getPhone(),
                s.getDateOfBirth(),
                s.getGender(),
                s.getGuardianName(),
                s.getGuardianPhone(),
                s.getEnrollmentYear(),
                s.getSectionId(),
                sectionLabel,
                null,   // only set on creation
                null
        );
    }

    /** Used after creation to include generated credentials */
    public static StudentResponse fromWithCredentials(Student s, String sectionLabel,
                                                       String genUsername, String genPassword) {
        return new StudentResponse(
                s.getId(),
                s.getStudentUid(),
                s.getUser().getId(),
                s.getUser().getUsername(),
                s.getUser().getFullName(),
                s.getUser().getEmail(),
                s.getUser().getPhone(),
                s.getDateOfBirth(),
                s.getGender(),
                s.getGuardianName(),
                s.getGuardianPhone(),
                s.getEnrollmentYear(),
                s.getSectionId(),
                sectionLabel,
                genUsername,
                genPassword
        );
    }
}
