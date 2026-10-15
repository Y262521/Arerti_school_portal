package com.arerti.portal.service;

import com.arerti.portal.dto.StaffAttendanceRequest;
import com.arerti.portal.dto.StaffAttendanceResponse;
import com.arerti.portal.entity.StaffAttendance;
import com.arerti.portal.entity.Teacher;
import com.arerti.portal.repository.StaffAttendanceRepository;
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

        // Validate status against the allowed set
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
}
