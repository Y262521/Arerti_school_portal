package com.arerti.portal.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record StaffAttendanceRequest(
    @NotNull Long teacherId,
    @NotNull LocalDate date,
    @NotNull String status,
    String note
) {}
