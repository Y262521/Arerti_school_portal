package com.arerti.portal.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

/** Used when updating an existing student. */
public record StudentUpdateRequest(
        @NotBlank @Email String email,
        String fullName,
        String firstName,
        String fatherName,
        String grandfatherName,
        String phone,
        LocalDate dateOfBirth,
        String gender,

        // Address
        String region,
        String city,
        String kebele,
        String houseNo,

        // Parent / Guardian
        @NotBlank String parentName,
        String parentRelationship,
        String parentPhone,

        // Academic & Placement
        Integer enrollmentYear,
        String academicYear,
        Integer grade,
        Long sectionId,
        String stream,
        String enrollmentType,
        String previousSchool,
        Double grade8Score,

        // Payment
        String paymentMethod,
        String bankTransactionRef,

        // Document URLs
        String photoUrl,
        String idDocUrl,
        String grade8CertificateUrl,
        String releaseLetterUrl,
        String paymentReceiptUrl
) {}

