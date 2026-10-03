package com.arerti.portal.dto;

import jakarta.validation.constraints.*;

import java.time.LocalDate;

/** Used when creating a new teacher — password is required. */
public record TeacherCreateRequest(
        @NotBlank String username,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 6) String password,
        @NotBlank String fullName,
        String phone,
        String qualification,
        String specialization,
        LocalDate hireDate
) {}
