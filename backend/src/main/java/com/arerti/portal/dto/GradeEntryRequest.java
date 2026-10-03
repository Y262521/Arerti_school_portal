package com.arerti.portal.dto;

import jakarta.validation.constraints.*;

public record GradeEntryRequest(
        @NotNull Long studentId,
        @NotNull Long subjectId,
        @NotNull @Min(1) @Max(3) Integer term,
        @NotBlank String academicYear,
        @NotNull @DecimalMin("0") @DecimalMax("100") Double score,
        String comment
) {}
