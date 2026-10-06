package com.arerti.portal.dto;

/** Summary of a student's pass/fail status using two-semester criteria */
public record StudentPassStatusResponse(
        Long studentId,
        String studentUid,
        String studentName,
        String currentSectionLabel,
        Integer currentGrade,
        boolean passed,
        double semester1Average,
        double semester2Average,
        double annualAverage,
        int failedSubjectsSem1,
        int failedSubjectsSem2,
        int totalSubjects,
        String reason,
        boolean alreadyEnrolled
) {}
