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
        String guardianName,
        String guardianPhone,
        Integer enrollmentYear,
        Long sectionId,
        String sectionLabel
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
                sectionLabel
        );
    }
}
