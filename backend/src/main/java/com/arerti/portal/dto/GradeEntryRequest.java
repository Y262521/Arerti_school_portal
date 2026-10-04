package com.arerti.portal.dto;

import jakarta.validation.constraints.*;

public record GradeEntryRequest(
        @NotNull Long studentId,
        @NotNull Long subjectId,
        @NotNull @Min(1) @Max(3) Integer term,
        @NotBlank String academicYear,

        @DecimalMin("0") @DecimalMax("20")  Double midExam,    // out of 20
        @DecimalMin("0") @DecimalMax("60")  Double finalExam,  // out of 60
        @DecimalMin("0") @DecimalMax("10")  Double assignment, // out of 10
        @DecimalMin("0") @DecimalMax("10")  Double testQuiz,   // out of 10

        String comment
) {}
