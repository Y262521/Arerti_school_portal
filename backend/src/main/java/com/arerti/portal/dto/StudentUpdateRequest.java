package com.arerti.portal.dto;

import jakarta.validation.constraints.*;

import java.time.LocalDate;

/** Used when updating an existing student — password is optional (blank = keep existing). */
public record StudentUpdateRequest(
        @NotBlank String username,
        @NotBlank @Email String email,
        @Size(min = 6) String password,   // null or blank → keep current password
        @NotBlank String fullName,
        String phone,
        LocalDate dateOfBirth,
        String gender,
        String guardianName,
        String guardianPhone,
        Integer enrollmentYear,
        Long sectionId
) {}
