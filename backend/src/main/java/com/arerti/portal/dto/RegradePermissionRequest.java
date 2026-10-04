package com.arerti.portal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RegradePermissionRequest(
        @NotNull Long subjectId,
        @NotNull Long sectionId,
        @NotNull Integer term,
        @NotBlank String academicYear,
        String reason
) {}
