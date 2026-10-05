package com.arerti.portal.controller;

import com.arerti.portal.dto.*;
import com.arerti.portal.service.RegistrationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/registration")
@RequiredArgsConstructor
public class RegistrationController {

    private final RegistrationService registrationService;

    // ── Director: window management ──────────────────────────────────────────

    @GetMapping("/windows")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<RegistrationWindowResponse>> listWindows() {
        return ResponseEntity.ok(registrationService.findAllWindows());
    }

    @GetMapping("/windows/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    public ResponseEntity<RegistrationWindowResponse> getWindow(@PathVariable Long id) {
        return ResponseEntity.ok(registrationService.findWindowById(id));
    }

    @PostMapping("/windows")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RegistrationWindowResponse> openWindow(
            @Valid @RequestBody RegistrationWindowRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(registrationService.openWindow(req));
    }

    @PostMapping("/windows/{id}/close")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RegistrationWindowResponse> closeWindow(@PathVariable Long id) {
        return ResponseEntity.ok(registrationService.closeWindow(id));
    }

    @PostMapping("/windows/{windowId}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RegistrationAssignmentResponse> assignTeacher(
            @PathVariable Long windowId,
            @Valid @RequestBody RegistrationAssignmentRequest req) {
        return ResponseEntity.ok(registrationService.assignTeacher(windowId, req));
    }

    @DeleteMapping("/assignments/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> removeAssignment(@PathVariable Long id) {
        registrationService.removeAssignment(id);
        return ResponseEntity.noContent().build();
    }

    // ── Teacher: check active window assignment ───────────────────────────────

    @GetMapping("/my-window")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<RegistrationWindowResponse> myWindow(Authentication auth) {
        RegistrationWindowResponse w = registrationService.getMyActiveWindow(auth.getName());
        if (w == null) return ResponseEntity.noContent().build();
        return ResponseEntity.ok(w);
    }

    // ── Teacher: view pass status for a grade (for re-enrollment) ────────────

    @GetMapping("/pass-status")
    @PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
    public ResponseEntity<List<StudentPassStatusResponse>> passStatus(
            @RequestParam Integer grade,
            @RequestParam String previousAcademicYear,
            @RequestParam String newAcademicYear) {
        return ResponseEntity.ok(registrationService.getPassStatusForGrade(
                grade, previousAcademicYear, newAcademicYear));
    }

    // ── Teacher: enroll new Grade 9 student ──────────────────────────────────

    @PostMapping("/windows/{windowId}/enroll-new")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<StudentResponse> enrollNew(
            @PathVariable Long windowId,
            @Valid @RequestBody NewStudentEnrollRequest req,
            Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(registrationService.enrollNewStudent(req, auth.getName(), windowId));
    }

    // ── Teacher: re-enroll Grade 10-12 student ───────────────────────────────

    @PostMapping("/windows/{windowId}/re-enroll")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<StudentResponse> reEnroll(
            @PathVariable Long windowId,
            @Valid @RequestBody ReEnrollRequest req,
            @RequestParam String previousAcademicYear,
            Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(registrationService.reEnrollStudent(
                        req, auth.getName(), windowId, previousAcademicYear));
    }
}
