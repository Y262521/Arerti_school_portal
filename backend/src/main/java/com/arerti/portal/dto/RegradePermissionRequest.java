package com.arerti.portal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RegradePermissionRequest(
        @NotNull Long studentId,   // specific student whose mark needs correction
        @NotNull Long subjectId,
        @NotNull Long sectionId,
        @NotNull Integer term,
        @NotBlank String academicYear,
        String reason
) {}
