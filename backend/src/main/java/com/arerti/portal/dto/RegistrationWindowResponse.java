package com.arerti.portal.dto;

import com.arerti.portal.entity.RegistrationWindow;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

public record RegistrationWindowResponse(
        Long id,
        String academicYear,
        LocalDateTime startDatetime,
        LocalDateTime endDatetime,
        String status,
        boolean active,
        String note,
        String openedBy,
        int postponeCount,
        Instant createdAt,
        List<RegistrationAssignmentResponse> assignments
) {
    public static RegistrationWindowResponse from(RegistrationWindow w,
                                                   List<RegistrationAssignmentResponse> assignments) {
        return new RegistrationWindowResponse(
                w.getId(), w.getAcademicYear(),
                w.getStartDatetime(), w.getEndDatetime(),
                w.getStatus().name(), w.isActive(),
                w.getNote(), w.getOpenedBy(),
                w.getPostponeCount(),
                w.getCreatedAt(), assignments
        );
    }
}
