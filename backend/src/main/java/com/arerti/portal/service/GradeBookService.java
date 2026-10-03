package com.arerti.portal.service;

import com.arerti.portal.dto.GradeEntryRequest;
import com.arerti.portal.dto.GradeEntryResponse;
import com.arerti.portal.entity.GradeEntry;
import com.arerti.portal.entity.Student;
import com.arerti.portal.entity.Subject;
import com.arerti.portal.entity.Teacher;
import com.arerti.portal.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GradeBookService {

    private final GradeEntryRepository gradeEntryRepository;
    private final StudentRepository studentRepository;
    private final SubjectRepository subjectRepository;
    private final TeacherRepository teacherRepository;

    /** All grades for a student in a given academic year */
    public List<GradeEntryResponse> getForStudent(Long studentId, String academicYear) {
        Student student = getStudent(studentId);
        return gradeEntryRepository.findByStudentAndAcademicYear(student, academicYear)
                .stream().map(GradeEntryResponse::from).collect(Collectors.toList());
    }

    /** All grades for a section / term — used by teachers */
    public List<GradeEntryResponse> getForSection(Long sectionId, Integer term, String academicYear) {
        return gradeEntryRepository.findByStudent_SectionIdAndTermAndAcademicYear(sectionId, term, academicYear)
                .stream().map(GradeEntryResponse::from).collect(Collectors.toList());
    }

    @Transactional
    public GradeEntryResponse upsert(GradeEntryRequest req, String teacherUsername) {
        Student student = getStudent(req.studentId());
        Subject subject = subjectRepository.findById(req.subjectId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Subject not found"));

        // Efficient single-query lookup — no more loading all teachers into memory
        Teacher teacher = teacherRepository.findByUser_Username(teacherUsername).orElse(null);

        GradeEntry entry = gradeEntryRepository
                .findByStudentIdAndSubjectIdAndTermAndAcademicYear(
                        req.studentId(), req.subjectId(), req.term(), req.academicYear())
                .orElse(GradeEntry.builder()
                        .student(student)
                        .subject(subject)
                        .term(req.term())
                        .academicYear(req.academicYear())
                        .build());

        entry.setScore(req.score());
        entry.setComment(req.comment());
        entry.setRecordedBy(teacher);
        return GradeEntryResponse.from(gradeEntryRepository.save(entry));
    }

    public void delete(Long id) {
        GradeEntry e = gradeEntryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Grade not found"));
        gradeEntryRepository.delete(e);
    }

    private Student getStudent(Long id) {
        return studentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));
    }
}
