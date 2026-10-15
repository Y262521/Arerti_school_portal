package com.arerti.portal.controller;

import com.arerti.portal.entity.*;
import com.arerti.portal.repository.*;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.io.*;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/export")
@RequiredArgsConstructor
public class ExportController {

    private final GradeEntryRepository gradeEntryRepository;
    private final AttendanceRepository attendanceRepository;
    private final ClassSubjectAssignmentRepository assignmentRepository;
    private final GradeSectionRepository sectionRepository;
    private final StudentRepository studentRepository;

    /** GET /api/export/grades?sectionId=X&term=Y&academicYear=Z */
    @GetMapping("/grades")
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    @Transactional(readOnly = true)
    public void exportGrades(
            @RequestParam Long sectionId,
            @RequestParam Integer term,
            @RequestParam String academicYear,
            HttpServletResponse response) throws IOException {

        GradeSection section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new RuntimeException("Section not found"));

        // All students in this section, sorted by UID
        List<Student> students = studentRepository.findBySectionId(sectionId).stream()
                .sorted(Comparator.comparing(Student::getStudentUid))
                .collect(Collectors.toList());

        // Subjects for this section (active assignments only), sorted by name
        List<ClassSubjectAssignment> assignments =
                assignmentRepository.findBySectionAndArchivedFalse(section);
        List<Subject> subjects = assignments.stream()
                .map(ClassSubjectAssignment::getSubject)
                .sorted(Comparator.comparing(Subject::getName))
                .collect(Collectors.toList());

        // Grade entries for this section/term/year
        List<GradeEntry> entries = gradeEntryRepository
                .findByStudent_SectionIdAndTermAndAcademicYear(sectionId, term, academicYear);

        // Index: studentId → subjectId → score
        Map<Long, Map<Long, Double>> scoreMap = new HashMap<>();
        for (GradeEntry e : entries) {
            scoreMap
                .computeIfAbsent(e.getStudent().getId(), k -> new HashMap<>())
                .put(e.getSubject().getId(), e.getScore());
        }

        String sectionLabel = section.getGrade() + "" + section.getSection();
        String filename = "grades-" + sectionLabel + "-sem" + term
                        + "-" + academicYear.replace("/", "-") + ".csv";
        response.setContentType("text/csv; charset=UTF-8");
        response.setHeader("Content-Disposition", "attachment; filename=\"" + filename + "\"");

        PrintWriter writer = response.getWriter();
        // Header row
        StringBuilder header = new StringBuilder("Student UID,Full Name");
        for (Subject s : subjects) header.append(",").append(escapeCsv(s.getName()));
        header.append(",Average");
        writer.println(header);

        // Data rows
        for (Student student : students) {
            StringBuilder row = new StringBuilder();
            row.append(escapeCsv(student.getStudentUid())).append(",");
            String fullName = student.getUser() != null ? student.getUser().getFullName() : "";
            row.append(escapeCsv(fullName));

            Map<Long, Double> studentScores = scoreMap.getOrDefault(student.getId(), Collections.emptyMap());
            List<Double> scores = new ArrayList<>();
            for (Subject s : subjects) {
                Double score = studentScores.get(s.getId());
                row.append(",").append(score != null ? score.toString() : "");
                if (score != null) scores.add(score);
            }
            double avg = scores.isEmpty() ? 0.0
                       : scores.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
            row.append(",").append(scores.isEmpty() ? "" : String.format("%.1f", avg));
            writer.println(row);
        }
        writer.flush();
    }

    /** GET /api/export/attendance?sectionId=X&startDate=Y&endDate=Z */
    @GetMapping("/attendance")
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    @Transactional(readOnly = true)
    public void exportAttendance(
            @RequestParam Long sectionId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            HttpServletResponse response) throws IOException {

        List<AttendanceRecord> records = attendanceRepository
                .findByStudent_SectionIdAndDateBetween(sectionId, startDate, endDate);

        // Sort by student UID then date
        records.sort(Comparator.comparing((AttendanceRecord r) -> r.getStudent().getStudentUid())
                .thenComparing(AttendanceRecord::getDate));

        GradeSection section = sectionRepository.findById(sectionId).orElse(null);
        String sectionLabel = section != null
            ? (section.getGrade() + "" + section.getSection()) : String.valueOf(sectionId);

        String filename = "attendance-" + sectionLabel
                        + "-" + startDate + "-to-" + endDate + ".csv";
        response.setContentType("text/csv; charset=UTF-8");
        response.setHeader("Content-Disposition", "attachment; filename=\"" + filename + "\"");

        PrintWriter writer = response.getWriter();
        writer.println("Student UID,Full Name,Date,Status");
        for (AttendanceRecord r : records) {
            String uid  = escapeCsv(r.getStudent().getStudentUid());
            String name = r.getStudent().getUser() != null
                        ? escapeCsv(r.getStudent().getUser().getFullName()) : "";
            writer.println(uid + "," + name + "," + r.getDate() + "," + r.getStatus());
        }
        writer.flush();
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
