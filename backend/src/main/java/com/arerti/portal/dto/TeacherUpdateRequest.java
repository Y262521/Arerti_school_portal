package com.arerti.portal.dto;

import jakarta.validation.constraints.*;

import java.time.LocalDate;

/** Used when updating an existing teacher — password is optional (blank = keep existing). */
public record TeacherUpdateRequest(
        @NotBlank String username,
        @NotBlank @Email String email,
        @Size(min = 6) String password,   // null or blank → keep current password
        @NotBlank String fullName,
        String phone,
        String qualification,
        String specialization,
        LocalDate hireDate
) {}
