package com.arerti.portal.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;

public record SupervisorCreateRequest(
        @NotBlank String firstName,
        @NotBlank String fatherName,
        @NotBlank String grandfatherName,
        @NotBlank String gender,
        LocalDate dateOfBirth,
        @NotBlank @Email String email,
        String phone,
        String photoUrl,
        String qualificationCertUrl,
        String idDocUrl
) {}
