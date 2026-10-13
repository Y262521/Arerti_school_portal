package com.arerti.portal.controller;

import com.arerti.portal.dto.GradeHistoryEntryResponse;
import com.arerti.portal.entity.EnrollmentRecord;
import com.arerti.portal.entity.GradeEntry;
import com.arerti.portal.entity.Student;
import com.arerti.portal.repository.EnrollmentRecordRepository;
import com.arerti.portal.repository.GradeEntryRepository;
import com.arerti.portal.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.OptionalDouble;

@RestController
@RequestMapping("/api/student")
@RequiredArgsConstructor
public class StudentGradeHistoryController {

    private final StudentRepository studentRepository;
    private final EnrollmentRecordRepository enrollmentRecordRepository;
    private final GradeEntryRepository gradeEntryRepository;

    @GetMapping("/my-grade-history")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<GradeHistoryEntryResponse>> getMyGradeHistory(Authentication auth) {
        Student student = studentRepository.findByUser_Username(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Student profile not found"));

        List<EnrollmentRecord> records = new ArrayList<>(enrollmentRecordRepository.findByStudent(student));
        // Sort by createdAt ascending so the most recently created enrollment is last
        // (frontend uses history[history.length - 1] for the pass/fail banner)
        records.sort(Comparator.comparing(EnrollmentRecord::getCreatedAt, Comparator.nullsFirst(Comparator.naturalOrder())));

        List<GradeHistoryEntryResponse> history = records.stream().map(record -> {
            String academicYear = record.getAcademicYear();
            Integer grade = record.getGrade();
            int batch = (grade != null) ? grade - 8 : 0;

            List<GradeEntry> sem1Entries = gradeEntryRepository
                    .findByStudentAndTermAndAcademicYear(student, 1, academicYear);
            List<GradeEntry> sem2Entries = gradeEntryRepository
                    .findByStudentAndTermAndAcademicYear(student, 2, academicYear);

            List<GradeHistoryEntryResponse.SubjectScore> sem1Grades = sem1Entries.stream()
                    .filter(e -> e.getSubject() != null)
                    .map(e -> new GradeHistoryEntryResponse.SubjectScore(e.getSubject().getName(), e.getScore()))
                    .toList();
            List<GradeHistoryEntryResponse.SubjectScore> sem2Grades = sem2Entries.stream()
                    .filter(e -> e.getSubject() != null)
                    .map(e -> new GradeHistoryEntryResponse.SubjectScore(e.getSubject().getName(), e.getScore()))
                    .toList();

            OptionalDouble sem1Opt = sem1Entries.stream()
                    .filter(e -> e.getScore() != null)
                    .mapToDouble(GradeEntry::getScore)
                    .average();
            OptionalDouble sem2Opt = sem2Entries.stream()
                    .filter(e -> e.getScore() != null)
                    .mapToDouble(GradeEntry::getScore)
                    .average();

            Double sem1Average = sem1Opt.isPresent() ? sem1Opt.getAsDouble() : null;
            Double sem2Average = sem2Opt.isPresent() ? sem2Opt.getAsDouble() : null;

            Double annualAverage = null;
            Boolean passed = null;
            if (sem1Average != null && sem2Average != null) {
                // Flat average: sum all scores across both semesters divided by total subject count
                // This avoids average-of-averages skew when semester subject counts differ
                double totalScore = sem1Entries.stream()
                        .filter(e -> e.getScore() != null).mapToDouble(GradeEntry::getScore).sum()
                        + sem2Entries.stream()
                        .filter(e -> e.getScore() != null).mapToDouble(GradeEntry::getScore).sum();
                long totalCount = sem1Entries.stream().filter(e -> e.getScore() != null).count()
                        + sem2Entries.stream().filter(e -> e.getScore() != null).count();
                annualAverage = totalCount > 0 ? totalScore / totalCount : null;
                passed = annualAverage != null && annualAverage >= 50.0;
            }

            return new GradeHistoryEntryResponse(
                    record.getId(),
                    academicYear,
                    grade,
                    batch,
                    record.getEnrollmentType() != null ? record.getEnrollmentType().name() : null,
                    record.getCreatedAt(),
                    sem1Grades,
                    sem2Grades,
                    sem1Average,
                    sem2Average,
                    annualAverage,
                    passed
            );
        }).toList();

        return ResponseEntity.ok(history);
    }
}
