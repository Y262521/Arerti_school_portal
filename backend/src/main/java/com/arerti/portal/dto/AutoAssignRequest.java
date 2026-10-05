package com.arerti.portal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AutoAssignRequest(
        @NotNull Integer grade,
        @NotBlank String academicYear
) {}
