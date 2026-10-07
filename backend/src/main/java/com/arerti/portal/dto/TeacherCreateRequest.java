package com.arerti.portal.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

/** Full teacher registration — username/password auto-generated. */
public record TeacherCreateRequest(
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

        // ── Contact ────────────────────────────────────────────────────────
        @NotBlank @Email String email,
        String phone,

        // ── Academic qualifications ────────────────────────────────────────
        @NotBlank String qualification,   // BSc | MSc | BA | MA | PhD | Dr | Diploma | Other
        String specialization,
        LocalDate hireDate,

        // ── Document URLs (Cloudinary) ─────────────────────────────────────
        String photoUrl,
        String qualificationCertUrl,
        String idDocUrl
) {}
