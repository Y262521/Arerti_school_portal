package com.arerti.portal.controller;

import com.arerti.portal.dto.GradeEntryWindowRequest;
import com.arerti.portal.dto.GradeEntryWindowResponse;
import com.arerti.portal.dto.PostponeRequest;
import com.arerti.portal.service.GradeEntryWindowService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/grade-entry-windows")
@RequiredArgsConstructor
public class GradeEntryWindowController {

    private final GradeEntryWindowService service;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    public ResponseEntity<List<GradeEntryWindowResponse>> list() {
        return ResponseEntity.ok(service.findAll());
    }

    /** Check if grade entry is open for a specific semester+year */
    @GetMapping("/status")
    @PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> status(
            @RequestParam String academicYear,
            @RequestParam Integer semester) {
        boolean open = service.isGradeEntryOpen(academicYear, semester);
        return ResponseEntity.ok(Map.of(
                "open", open,
                "academicYear", academicYear,
                "semester", semester,
                "message", open
                        ? "Grade entry is open for Semester " + semester + " " + academicYear
                        : "Grade entry is closed. Contact the director to open it."
        ));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<GradeEntryWindowResponse> open(
            @Valid @RequestBody GradeEntryWindowRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.open(req));
    }

    @PostMapping("/{id}/postpone")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<GradeEntryWindowResponse> postpone(
            @PathVariable Long id,
            @Valid @RequestBody PostponeRequest req) {
        return ResponseEntity.ok(service.postpone(id, req));
    }

    @PostMapping("/{id}/close")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<GradeEntryWindowResponse> close(@PathVariable Long id) {
        return ResponseEntity.ok(service.close(id));
    }
}
