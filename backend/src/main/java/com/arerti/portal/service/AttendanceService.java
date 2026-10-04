package com.arerti.portal.service;

import com.arerti.portal.dto.AttendanceRequest;
import com.arerti.portal.dto.AttendanceResponse;
import com.arerti.portal.entity.AttendanceRecord;
import com.arerti.portal.entity.GradeSection;
import com.arerti.portal.entity.Student;
import com.arerti.portal.entity.Teacher;
import com.arerti.portal.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final StudentRepository studentRepository;
    private final TeacherRepository teacherRepository;
    private final GradeSectionRepository gradeSectionRepository;

    public List<AttendanceResponse> getForStudent(Long studentId) {
        Student student = getStudent(studentId);
        return attendanceRepository.findByStudentOrderByDateDesc(student)
                .stream().map(AttendanceResponse::from).collect(Collectors.toList());
    }

    public List<AttendanceResponse> getForSectionDate(Long sectionId, LocalDate date) {
        return attendanceRepository.findByStudent_SectionIdAndDate(sectionId, date)
                .stream().map(AttendanceResponse::from).collect(Collectors.toList());
    }

    @Transactional
    public AttendanceResponse mark(AttendanceRequest req, String actorUsername, boolean isAdmin) {
        Student student = getStudent(req.studentId());

        // Efficient single-query lookup
        Teacher teacher = teacherRepository.findByUser_Username(actorUsername).orElse(null);

        // Enforce homeroom-only rule for teachers
        if (!isAdmin) {
            if (teacher == null) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Only teachers or admins can mark attendance");
            }
            Long sectionId = student.getSectionId();
            if (sectionId != null) {
                GradeSection section = gradeSectionRepository.findById(sectionId).orElse(null);
                if (section != null && section.getHomeroomTeacher() != null
                        && !section.getHomeroomTeacher().getId().equals(teacher.getId())) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                            "Only the homeroom teacher of this class can mark attendance");
                }
            }
        }

        AttendanceRecord record = attendanceRepository
                .findByStudentIdAndDate(req.studentId(), req.date())
                .orElse(AttendanceRecord.builder()
                        .student(student)
                        .date(req.date())
                        .build());

        record.setStatus(req.status().toUpperCase());
        record.setNote(req.note());
        record.setMarkedBy(teacher);
        return AttendanceResponse.from(attendanceRepository.save(record));
    }

    public void delete(Long id, String actorUsername, boolean isAdmin) {
        AttendanceRecord r = attendanceRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));

        if (!isAdmin) {
            Teacher teacher = teacherRepository.findByUser_Username(actorUsername).orElse(null);
            Long sectionId = r.getStudent().getSectionId();
            if (sectionId != null && teacher != null) {
                GradeSection section = gradeSectionRepository.findById(sectionId).orElse(null);
                if (section != null && section.getHomeroomTeacher() != null
                        && !section.getHomeroomTeacher().getId().equals(teacher.getId())) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                            "Only the homeroom teacher of this class can delete attendance records");
                }
            }
        }
        attendanceRepository.delete(r);
    }

    private Student getStudent(Long id) {
        return studentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));
    }
}
