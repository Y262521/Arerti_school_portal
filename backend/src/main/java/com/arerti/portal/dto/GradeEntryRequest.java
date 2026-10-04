package com.arerti.portal.dto;

import jakarta.validation.constraints.*;

public record GradeEntryRequest(
        @NotNull Long studentId,
        @NotNull Long subjectId,
        @NotNull @Min(1) @Max(3) Integer term,
        @NotBlank String academicYear,

        @DecimalMin("0") @DecimalMax("30")  Double midExam,    // out of 30
        @DecimalMin("0") @DecimalMax("40")  Double finalExam,  // out of 40
        @DecimalMin("0") @DecimalMax("20")  Double assignment, // out of 20
        @DecimalMin("0") @DecimalMax("10")  Double testQuiz,   // out of 10

        String comment
) {}
