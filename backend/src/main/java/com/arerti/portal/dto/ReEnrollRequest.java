package com.arerti.portal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/** Re-enrollment for a returning student (Grade 10, 11, 12) */
public record ReEnrollRequest(
        @NotNull Long studentId,
        @NotNull Long newSectionId,       // which section they move to
        @NotBlank String bankTransactionRef
) {}
