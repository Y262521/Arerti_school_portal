package com.arerti.portal.dto;

import com.arerti.portal.entity.RegistrationWindow;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record RegistrationWindowResponse(
        Long id,
        String academicYear,
        LocalDate startDate,
        LocalDate endDate,
        String status,
        boolean active,
        String note,
        String openedBy,
        Instant createdAt,
        List<RegistrationAssignmentResponse> assignments
) {
    public static RegistrationWindowResponse from(RegistrationWindow w,
                                                   List<RegistrationAssignmentResponse> assignments) {
        return new RegistrationWindowResponse(
                w.getId(), w.getAcademicYear(),
                w.getStartDate(), w.getEndDate(),
                w.getStatus().name(), w.isActive(),
                w.getNote(), w.getOpenedBy(),
                w.getCreatedAt(), assignments
        );
    }
}
