package com.arerti.portal.service;

import com.arerti.portal.dto.GradeEntryResponse;
import com.arerti.portal.dto.ReportCardResponse;
import com.arerti.portal.entity.Student;
import com.arerti.portal.repository.AttendanceRepository;
import com.arerti.portal.repository.GradeEntryRepository;
import com.arerti.portal.repository.GradeSectionRepository;
import com.arerti.portal.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportCardService {

    private final StudentRepository studentRepository;
    private final GradeEntryRepository gradeEntryRepository;
    private final AttendanceRepository attendanceRepository;
    private final GradeSectionRepository gradeSectionRepository;

    public ReportCardResponse generate(Long studentId, Integer term, String academicYear) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));

        List<GradeEntryResponse> grades = gradeEntryRepository
                .findByStudentAndTermAndAcademicYear(student, term, academicYear)
                .stream().map(GradeEntryResponse::from).collect(Collectors.toList());

        Double average = grades.isEmpty() ? null :
                grades.stream().mapToDouble(GradeEntryResponse::score).average().orElse(0);

        long totalDays = attendanceRepository.countTotalByStudent(student);
        long presentDays = attendanceRepository.countPresentByStudent(student);
        double attendancePct = totalDays == 0 ? 0 : (presentDays * 100.0 / totalDays);

        String sectionLabel = student.getSectionId() != null
                ? gradeSectionRepository.findById(student.getSectionId())
                .map(gs -> "Grade " + gs.getGrade() + " – " + gs.getSection())
                .orElse(null)
                : null;

        return new ReportCardResponse(
                student.getId(),
                student.getStudentUid(),
                student.getUser().getFullName(),
                sectionLabel,
                academicYear,
                term,
                grades,
                average,
                letterGrade(average),
                totalDays,
                presentDays,
                Math.round(attendancePct * 10.0) / 10.0
        );
    }

    private String letterGrade(Double avg) {
        if (avg == null) return "—";
        if (avg >= 90) return "A+";
        if (avg >= 85) return "A";
        if (avg >= 80) return "A-";
        if (avg >= 75) return "B+";
        if (avg >= 70) return "B";
        if (avg >= 65) return "C+";
        if (avg >= 60) return "C";
        if (avg >= 50) return "D";
        return "F";
    }
}
