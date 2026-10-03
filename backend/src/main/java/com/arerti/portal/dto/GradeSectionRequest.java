package com.arerti.portal.dto;

import jakarta.validation.constraints.*;

public record GradeSectionRequest(
        @NotNull @Min(9) @Max(12) Integer grade,
        @NotBlank String section,
        @NotBlank String academicYear,
        Long homeroomTeacherId,
        Integer maxCapacity
) {}
