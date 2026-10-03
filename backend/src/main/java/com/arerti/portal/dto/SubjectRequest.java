package com.arerti.portal.dto;

import jakarta.validation.constraints.NotBlank;

public record SubjectRequest(
        @NotBlank String name,
        String code,
        String applicableGrades
) {}
