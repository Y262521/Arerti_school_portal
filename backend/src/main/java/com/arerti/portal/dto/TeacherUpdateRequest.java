package com.arerti.portal.dto;

import jakarta.validation.constraints.*;

import java.time.LocalDate;

/** Update existing teacher — username stays the same, password optional. */
public record TeacherUpdateRequest(
        @NotBlank @Email String email,
        @NotBlank String fullName,
        String phone,
        String qualification,
        String specialization,
        LocalDate hireDate
) {}
