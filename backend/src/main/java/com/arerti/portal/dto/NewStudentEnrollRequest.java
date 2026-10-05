package com.arerti.portal.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

/** Full registration for a new Grade 9 student */
public record NewStudentEnrollRequest(
        @NotBlank @Email String email,
        @NotBlank String fullName,
        String phone,
        LocalDate dateOfBirth,
        String gender,
        @NotBlank String parentName,
        String parentPhone,
        @NotNull Long sectionId,          // which section — optional, can be null (auto-assigned later)
        @NotBlank String bankTransactionRef
) {}
