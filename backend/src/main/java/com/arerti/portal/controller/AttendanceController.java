package com.arerti.portal.controller;

import com.arerti.portal.dto.AttendanceRequest;
import com.arerti.portal.dto.AttendanceResponse;
import com.arerti.portal.entity.Student;
import com.arerti.portal.repository.ParentLinkRepository;
import com.arerti.portal.repository.StudentRepository;
import com.arerti.portal.repository.UserRepository;
import com.arerti.portal.service.AttendanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;
    private final StudentRepository studentRepository;
    private final ParentLinkRepository parentLinkRepository;
    private final UserRepository userRepository;

    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER') or hasRole('STUDENT') or hasRole('PARENT')")
    public ResponseEntity<List<AttendanceResponse>> forStudent(
            @PathVariable Long studentId,
            Authentication auth) {
        boolean isStudent = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_STUDENT"));
        if (isStudent) {
            Student s = studentRepository.findByUser_Username(auth.getName())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Student profile not found"));
            if (!s.getId().equals(studentId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are only permitted to view your own attendance");
            }
        }
        boolean isParent = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_PARENT"));
        if (isParent) {
            Long parentUserId = userRepository.findByUsername(auth.getName())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unknown user"))
                    .getId();
            if (!parentLinkRepository.existsByParentIdAndStudentId(parentUserId, studentId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This student is not linked to your account");
            }
        }
        return ResponseEntity.ok(attendanceService.getForStudent(studentId));
    }

    @GetMapping("/section/{sectionId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    public ResponseEntity<List<AttendanceResponse>> forSection(
            @PathVariable Long sectionId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(attendanceService.getForSectionDate(sectionId, date));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    public ResponseEntity<AttendanceResponse> mark(@Valid @RequestBody AttendanceRequest req,
                                                    Authentication auth) {
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        return ResponseEntity.ok(attendanceService.mark(req, auth.getName(), isAdmin));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication auth) {
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        attendanceService.delete(id, auth.getName(), isAdmin);
        return ResponseEntity.noContent().build();
    }
}
