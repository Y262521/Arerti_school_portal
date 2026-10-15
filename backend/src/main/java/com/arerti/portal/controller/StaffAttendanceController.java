package com.arerti.portal.controller;

import com.arerti.portal.dto.StaffAttendanceRequest;
import com.arerti.portal.dto.StaffAttendanceResponse;
import com.arerti.portal.service.StaffAttendanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/staff-attendance")
@RequiredArgsConstructor
public class StaffAttendanceController {

    private final StaffAttendanceService staffAttendanceService;

    /** GET /api/staff-attendance?date=YYYY-MM-DD — ADMIN only */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<StaffAttendanceResponse>> getForDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(staffAttendanceService.getForDate(date));
    }

    /** POST /api/staff-attendance — ADMIN only */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StaffAttendanceResponse> mark(
            @Valid @RequestBody StaffAttendanceRequest req,
            Authentication auth) {
        return ResponseEntity.ok(staffAttendanceService.mark(req, auth.getName()));
    }

    /** GET /api/staff-attendance/my — TEACHER only */
    @GetMapping("/my")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<List<StaffAttendanceResponse>> myAttendance(Authentication auth) {
        return ResponseEntity.ok(staffAttendanceService.getForTeacher(auth.getName()));
    }
}
