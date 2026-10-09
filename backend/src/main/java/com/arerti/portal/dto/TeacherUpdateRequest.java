package com.arerti.portal.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

/** Update existing teacher — username stays the same, password optional. */
public record TeacherUpdateRequest(
        @NotBlank @Email String email,
        String fullName,
        String firstName,
        String fatherName,
        String grandfatherName,
        String gender,
        LocalDate dateOfBirth,
        String phone,
        String region,
        String city,
        String kebele,
        String houseNo,
        @NotBlank String qualification,
        String specialization,
        LocalDate hireDate,
        String photoUrl,
        String qualificationCertUrl,
        String idDocUrl
) {}

