package com.arerti.portal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Quick re-enrollment for PROMOTED or REPEATER students already in the system.
 * sectionId is optional — director auto-assigns after registration closes.
 */
public record ExistingStudentEnrollRequest(
        @NotNull Long studentId,
        Long newSectionId,                // null = auto-assigned later
        String stream,                    // required for Grade 11-12
        @NotBlank String enrollmentType,  // PROMOTED | REPEATER
        @NotBlank String paymentMethod,
        @NotBlank String bankTransactionRef,
        String paymentReceiptUrl
) {}
