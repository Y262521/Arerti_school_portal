package com.arerti.portal.dto;

import jakarta.validation.constraints.*;

import java.time.LocalDate;

/** Used when updating an existing student. Username auto-generated; password optional. */
public record StudentUpdateRequest(
        @NotBlank @Email String email,
        @NotBlank String fullName,
        String phone,
        LocalDate dateOfBirth,
        String gender,
        @NotBlank String parentName,      // required
        String parentPhone,
        Integer enrollmentYear,
        Long sectionId
) {}
