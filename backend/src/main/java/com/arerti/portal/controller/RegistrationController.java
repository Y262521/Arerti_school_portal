package com.arerti.portal.controller;

import com.arerti.portal.dto.*;
import com.arerti.portal.service.CloudinaryService;
import com.arerti.portal.service.RegistrationService;import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/registration")
@RequiredArgsConstructor
public class RegistrationController {

    private final RegistrationService registrationService;
    private final CloudinaryService cloudinaryService;

    // ── File upload (used before submitting forms) ────────────────────────────

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "documents") String folder) {
        String url = cloudinaryService.upload(file, folder);
        return ResponseEntity.ok(Map.of("url", url));
    }

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

    @PostMapping("/windows/{id}/postpone")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RegistrationWindowResponse> postponeWindow(
            @PathVariable Long id,
            @Valid @RequestBody PostponeRequest req) {
        return ResponseEntity.ok(registrationService.postponeWindow(id, req));
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

    @GetMapping("/windows/{id}/enrollments")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<EnrollmentRecordResponse>> getEnrollments(@PathVariable Long id) {
        return ResponseEntity.ok(registrationService.getEnrollmentsForWindow(id));
    }

    /** Director triggers auto-assignment of registered students to sections */
    @PostMapping("/auto-assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AutoAssignResponse> autoAssign(
            @Valid @RequestBody AutoAssignRequest req) {
        return ResponseEntity.ok(registrationService.autoAssign(req));
    }

    // ── Teacher: check active window ─────────────────────────────────────────

    @GetMapping("/my-window")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<RegistrationWindowResponse> myWindow(Authentication auth) {
        RegistrationWindowResponse w = registrationService.getMyActiveWindow(auth.getName());
        if (w == null) return ResponseEntity.noContent().build();
        return ResponseEntity.ok(w);
    }

    // ── Pass status for re-enrollment list ───────────────────────────────────

    @GetMapping("/pass-status")
    @PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
    public ResponseEntity<List<StudentPassStatusResponse>> passStatus(
            @RequestParam Integer grade,
            @RequestParam String previousAcademicYear,
            @RequestParam String newAcademicYear) {
        return ResponseEntity.ok(registrationService.getPassStatusForGrade(
                grade, previousAcademicYear, newAcademicYear));
    }

    // ── Full enrollment (NEW / TRANSFER) ─────────────────────────────────────

    @PostMapping("/windows/{windowId}/enroll")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<StudentResponse> enrollFull(
            @PathVariable Long windowId,
            @Valid @RequestBody FullEnrollRequest req,
            Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(registrationService.enrollFullForm(req, auth.getName(), windowId));
    }

    // ── Quick re-enrollment (PROMOTED / REPEATER) ────────────────────────────

    @PostMapping("/windows/{windowId}/enroll-existing")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<EnrollmentRecordResponse> enrollExisting(
            @PathVariable Long windowId,
            @Valid @RequestBody ExistingStudentEnrollRequest req,
            @RequestParam String previousAcademicYear,
            Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(registrationService.enrollExisting(
                        req, auth.getName(), windowId, previousAcademicYear));
    }
}
