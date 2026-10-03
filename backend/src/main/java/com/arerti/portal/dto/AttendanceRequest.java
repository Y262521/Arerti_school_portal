package com.arerti.portal.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record AttendanceRequest(
        @NotNull Long studentId,
        @NotNull LocalDate date,
        @NotNull String status,   // PRESENT | ABSENT | LATE | EXCUSED
        String note
) {}
