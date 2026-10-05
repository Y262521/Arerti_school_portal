package com.arerti.portal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RegistrationAssignmentRequest(
        @NotNull Long teacherId,
        @NotBlank String allowedGrades   // e.g. "9" or "9,10" or "9,10,11,12"
) {}
