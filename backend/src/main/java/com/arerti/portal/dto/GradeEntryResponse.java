package com.arerti.portal.dto;

import com.arerti.portal.entity.GradeEntry;

import java.time.Instant;

public record GradeEntryResponse(
        Long id,
        Long studentId,
        String studentName,
        String studentUid,
        Long subjectId,
        String subjectName,
        Integer term,
        String academicYear,
        Double midExam,
        Double finalExam,
        Double assignment,
        Double testQuiz,
        Double score,
        String grade,
        String comment,
        boolean locked,
        String recordedBy,
        Instant updatedAt
) {
    public static GradeEntryResponse from(GradeEntry e) {
        return new GradeEntryResponse(
                e.getId(),
                e.getStudent().getId(),
                e.getStudent().getUser().getFullName(),
                e.getStudent().getStudentUid(),
                e.getSubject().getId(),
                e.getSubject().getName(),
                e.getTerm(),
                e.getAcademicYear(),
                e.getMidExam(),
                e.getFinalExam(),
                e.getAssignment(),
                e.getTestQuiz(),
                e.getScore(),
                letterGrade(e.getScore()),
                e.getComment(),
                e.isLocked(),
                e.getRecordedBy() != null ? e.getRecordedBy().getUser().getFullName() : null,
                e.getUpdatedAt()
        );
    }

    public static String letterGrade(Double score) {
        if (score == null) return "—";
        if (score >= 90) return "A+";
        if (score >= 85) return "A";
        if (score >= 80) return "A-";
        if (score >= 75) return "B+";
        if (score >= 70) return "B";
        if (score >= 65) return "C+";
        if (score >= 60) return "C";
        if (score >= 50) return "D";
        return "F";
    }
}
