package com.arerti.portal.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

/**
 * Full registration form for NEW (Grade 9) and TRANSFER students.
 * Files are uploaded separately via /api/registration/upload endpoint
 * and their Cloudinary URLs are passed here.
 */
public record FullEnrollRequest(
        // ── Personal info ──────────────────────────────────────────────────
        @NotBlank String firstName,
        @NotBlank String fatherName,
        @NotBlank String grandfatherName,
        @NotBlank String gender,
        LocalDate dateOfBirth,
        String region,
        String city,
        String kebele,
        String houseNo,

        // ── Cloudinary URLs (uploaded before form submit) ──────────────────
        String photoUrl,
        String idDocUrl,
        String grade8CertificateUrl,
        String releaseLetterUrl,      // required for TRANSFER only

        // ── Academic history ───────────────────────────────────────────────
        Double grade8Score,
        String previousSchool,
        @NotBlank @Email String email,

        // ── Grade & section ────────────────────────────────────────────────
        @NotNull Long sectionId,
        String stream,                // NATURAL_SCIENCE | SOCIAL_SCIENCE (Grade 11-12 only)

        // ── Enrollment type ────────────────────────────────────────────────
        @NotBlank String enrollmentType, // NEW | TRANSFER

        // ── Parent/Guardian ────────────────────────────────────────────────
        @NotBlank String parentName,
        String parentRelationship,
        @Pattern(regexp = "^(09|07)\\d{8}$", message = "Phone must start with 09 or 07 and be 10 digits")
        String parentPhone,

        // ── Payment ────────────────────────────────────────────────────────
        @NotBlank String paymentMethod,
        @NotBlank String bankTransactionRef,
        String paymentReceiptUrl
) {}
