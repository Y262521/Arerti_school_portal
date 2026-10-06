package com.arerti.portal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Quick re-enrollment for PROMOTED or REPEATER students already in the system.
 * Only needs: student ID, target section, payment info, stream (Grade 11-12).
 */
public record ExistingStudentEnrollRequest(
        @NotNull Long studentId,
        @NotNull Long newSectionId,
        String stream,                // required for Grade 11-12
        @NotBlank String enrollmentType,  // PROMOTED | REPEATER
        @NotBlank String paymentMethod,
        @NotBlank String bankTransactionRef,
        String paymentReceiptUrl
) {}
