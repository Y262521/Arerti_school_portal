package com.arerti.portal.dto;

import jakarta.validation.constraints.NotBlank;

public record NoticeRequest(
        @NotBlank String title,
        @NotBlank String body,
        String audience,   // GENERAL | STUDENTS | TEACHERS | PARENTS
        String priority,   // LOW | MEDIUM | HIGH
        boolean pinned
) {}
