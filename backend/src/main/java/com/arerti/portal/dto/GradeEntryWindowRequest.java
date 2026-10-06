package com.arerti.portal.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public record GradeEntryWindowRequest(
        @NotBlank String academicYear,
        @NotNull @Min(1) @Max(2) Integer semester,
        @NotNull LocalDateTime startDatetime,
        @NotNull LocalDateTime endDatetime,
        String note
) {}
