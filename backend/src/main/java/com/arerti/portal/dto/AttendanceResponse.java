package com.arerti.portal.dto;

import com.arerti.portal.entity.AttendanceRecord;

import java.time.Instant;
import java.time.LocalDate;

public record AttendanceResponse(
        Long id,
        Long studentId,
        String studentName,
        String studentUid,
        LocalDate date,
        String status,
        String note,
        String markedBy,
        Instant createdAt
) {
    public static AttendanceResponse from(AttendanceRecord a) {
        return new AttendanceResponse(
                a.getId(),
                a.getStudent().getId(),
                a.getStudent().getUser().getFullName(),
                a.getStudent().getStudentUid(),
                a.getDate(),
                a.getStatus(),
                a.getNote(),
                a.getMarkedBy() != null ? a.getMarkedBy().getUser().getFullName() : null,
                a.getCreatedAt()
        );
    }
}
