package com.arerti.portal.dto;

import com.arerti.portal.entity.StaffAttendance;

import java.time.Instant;
import java.time.LocalDate;

public record StaffAttendanceResponse(
    Long id,
    Long teacherId,
    String teacherName,
    String employeeId,
    LocalDate date,
    String status,
    String note,
    String markedBy,
    Instant createdAt
) {
    public static StaffAttendanceResponse from(StaffAttendance sa) {
        return new StaffAttendanceResponse(
            sa.getId(),
            sa.getTeacher().getId(),
            sa.getTeacher().getUser() != null ? sa.getTeacher().getUser().getFullName() : null,
            sa.getTeacher().getEmployeeId(),
            sa.getDate(),
            sa.getStatus(),
            sa.getNote(),
            sa.getMarkedBy(),
            sa.getCreatedAt()
        );
    }
}
