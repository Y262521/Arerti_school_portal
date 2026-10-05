package com.arerti.portal.dto;

/** Summary of a student's pass/fail status for the current academic year */
public record StudentPassStatusResponse(
        Long studentId,
        String studentUid,
        String studentName,
        String currentSectionLabel,
        Integer currentGrade,
        boolean passed,
        double average,
        int failedSubjects,
        int totalSubjects,
        String reason,
        boolean alreadyEnrolled  // already enrolled for the new academic year
) {}
