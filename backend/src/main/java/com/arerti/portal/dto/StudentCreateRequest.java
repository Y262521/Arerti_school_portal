package com.arerti.portal.dto;

import jakarta.validation.constraints.*;

import java.time.LocalDate;

/** Used when creating a new student — password is required. */
public record StudentCreateRequest(
        @NotBlank String username,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 6) String password,
        @NotBlank String fullName,
        String phone,
        LocalDate dateOfBirth,
        String gender,
        String guardianName,
        String guardianPhone,
        Integer enrollmentYear,
        Long sectionId
) {}
