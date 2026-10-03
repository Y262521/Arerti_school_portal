package com.arerti.portal.dto;

import java.util.List;

public record ReportCardResponse(
        Long studentId,
        String studentUid,
        String studentName,
        String sectionLabel,
        String academicYear,
        Integer term,
        List<GradeEntryResponse> grades,
        Double average,
        String overallGrade,
        long totalDays,
        long presentDays,
        double attendancePercent
) {}
