package com.arerti.portal.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public record PostponeRequest(
        @NotNull LocalDateTime newEndDatetime,
        String reason
) {}
