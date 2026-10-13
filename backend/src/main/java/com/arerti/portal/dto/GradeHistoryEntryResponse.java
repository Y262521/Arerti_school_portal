package com.arerti.portal.dto;

import java.time.Instant;
import java.util.List;

public record GradeHistoryEntryResponse(
        Long id,
        String academicYear,
        Integer grade,
        Integer batch,
        String enrollmentType,
        Instant registrationDate,
        List<SubjectScore> sem1Grades,
        List<SubjectScore> sem2Grades,
        Double sem1Average,
        Double sem2Average,
        Double annualAverage,
        Boolean passed
) {
    public record SubjectScore(String subjectName, Double score) {}
}
