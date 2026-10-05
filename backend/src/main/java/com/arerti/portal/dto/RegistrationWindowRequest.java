package com.arerti.portal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record RegistrationWindowRequest(
        @NotBlank String academicYear,
        @NotNull LocalDate startDate,
        @NotNull LocalDate endDate,
        String note
) {}
