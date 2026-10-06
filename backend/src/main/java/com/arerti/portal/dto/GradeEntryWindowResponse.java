package com.arerti.portal.dto;

import com.arerti.portal.entity.GradeEntryWindow;
import java.time.Instant;
import java.time.LocalDateTime;

public record GradeEntryWindowResponse(
        Long id,
        String academicYear,
        Integer semester,
        LocalDateTime startDatetime,
        LocalDateTime endDatetime,
        String status,
        boolean active,
        String note,
        String openedBy,
        int postponeCount,
        Instant createdAt
) {
    public static GradeEntryWindowResponse from(GradeEntryWindow w) {
        return new GradeEntryWindowResponse(
                w.getId(), w.getAcademicYear(), w.getSemester(),
                w.getStartDatetime(), w.getEndDatetime(),
                w.getStatus().name(), w.isActive(),
                w.getNote(), w.getOpenedBy(),
                w.getPostponeCount(), w.getCreatedAt()
        );
    }
}
