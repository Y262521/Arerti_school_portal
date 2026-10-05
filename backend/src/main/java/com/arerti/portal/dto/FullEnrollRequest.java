package com.arerti.portal.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

/**
 * Full registration for NEW (Grade 9) and TRANSFER students.
 * sectionId is intentionally optional — director auto-assigns students
 * to sections after registration closes (balanced by performance score).
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

        // ── Cloudinary URLs ────────────────────────────────────────────────
        String photoUrl,
        String idDocUrl,
        String grade8CertificateUrl,
        String releaseLetterUrl,

        // ── Academic history ───────────────────────────────────────────────
        Double grade8Score,
        String previousSchool,
        @NotBlank @Email String email,

        // ── Grade — sectionId is NULL (auto-assigned later by director) ────
        @NotNull Integer targetGrade,     // 9, 10, 11, or 12
        Long sectionId,                   // null at registration time
        String stream,                    // NATURAL_SCIENCE | SOCIAL_SCIENCE (Grade 11-12 only)
        @NotBlank String academicYear,    // e.g. "2026/2027"

        @NotBlank String enrollmentType,  // NEW | TRANSFER

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
