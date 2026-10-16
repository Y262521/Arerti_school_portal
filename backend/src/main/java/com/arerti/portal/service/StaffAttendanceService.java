package com.arerti.portal.service;

import com.arerti.portal.dto.StaffAttendanceRequest;
import com.arerti.portal.dto.StaffAttendanceResponse;
import com.arerti.portal.entity.StaffAttendance;
import com.arerti.portal.entity.Teacher;
import com.arerti.portal.repository.ClassSubjectAssignmentRepository;
import com.arerti.portal.repository.StaffAttendanceRepository;
import com.arerti.portal.repository.SupervisorClassAssignmentRepository;
import com.arerti.portal.repository.TeacherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StaffAttendanceService {

    private static final Set<String> ALLOWED_STATUSES =
            Set.of("PRESENT", "ABSENT", "LATE", "EXCUSED");

    private final StaffAttendanceRepository staffAttendanceRepository;
    private final TeacherRepository teacherRepository;
    private final SupervisorClassAssignmentRepository supervisorClassAssignmentRepository;
    private final ClassSubjectAssignmentRepository classSubjectAssignmentRepository;

    /** List all teachers with their attendance status for a given date. */
    public List<StaffAttendanceResponse> getForDate(LocalDate date) {
        return staffAttendanceRepository.findByDate(date)
                .stream().map(StaffAttendanceResponse::from).collect(Collectors.toList());
    }

    /** Teacher's own attendance history. */
    public List<StaffAttendanceResponse> getForTeacher(String username) {
        Teacher teacher = teacherRepository.findByUser_Username(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Teacher profile not found"));
        return staffAttendanceRepository.findByTeacherOrderByDateDesc(teacher)
                .stream().map(StaffAttendanceResponse::from).collect(Collectors.toList());
    }

    /** Upsert — mark or update a teacher's attendance for a date. */
    @Transactional
    public StaffAttendanceResponse mark(StaffAttendanceRequest req, String markedBy) {
        Teacher teacher = teacherRepository.findById(req.teacherId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Teacher not found"));

        if (req.status() == null || !ALLOWED_STATUSES.contains(req.status())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid status. Must be one of: PRESENT, ABSENT, LATE, EXCUSED");
        }

        StaffAttendance record = staffAttendanceRepository
                .findByTeacherAndDate(teacher, req.date())
                .orElse(null);
        if (record == null) {
            record = StaffAttendance.builder()
                    .teacher(teacher)
                    .date(req.date())
                    .build();
        }
        record.setStatus(req.status());
        record.setNote(req.note());
        record.setMarkedBy(markedBy);
        return StaffAttendanceResponse.from(staffAttendanceRepository.save(record));
    }

    /** Supervisor: get attendance for date filtered to their supervised classes. */
    public List<StaffAttendanceResponse> getForSupervisedDate(LocalDate date, String supervisorUsername) {
        Set<Long> teacherIds = getTeacherIdsForSupervisor(supervisorUsername);
        return staffAttendanceRepository.findByDate(date).stream()
                .filter(r -> teacherIds.contains(r.getTeacher().getId()))
                .map(StaffAttendanceResponse::from)
                .collect(Collectors.toList());
    }

    /** Supervisor: mark attendance for a teacher, only if that teacher is in their supervised classes. */
    @Transactional
    public StaffAttendanceResponse markForSupervisor(StaffAttendanceRequest req, String supervisorUsername) {
        Set<Long> teacherIds = getTeacherIdsForSupervisor(supervisorUsername);
        if (!teacherIds.contains(req.teacherId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "This teacher is not in your supervised classes");
        }
        return mark(req, supervisorUsername);
    }

    private Set<Long> getTeacherIdsForSupervisor(String supervisorUsername) {
        // Get all sections assigned to this supervisor
        List<com.arerti.portal.entity.GradeSection> sections =
                supervisorClassAssignmentRepository
                .findBySupervisor_Username(supervisorUsername).stream()
                .map(a -> a.getSection())
                .collect(Collectors.toList());

        if (sections.isEmpty()) return Set.of();

        // For each section, get the assigned teachers via ClassSubjectAssignment
        return sections.stream()
                .flatMap(section ->
                    classSubjectAssignmentRepository.findBySectionAndArchivedFalse(section).stream()
                        .filter(a -> a.getTeacher() != null)
                        .map(a -> a.getTeacher().getId())
                )
                .collect(Collectors.toSet());
    }
}
