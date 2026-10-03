package com.arerti.portal.controller;

import com.arerti.portal.dto.GradeEntryRequest;
import com.arerti.portal.dto.GradeEntryResponse;
import com.arerti.portal.service.GradeBookService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/grades")
@RequiredArgsConstructor
public class GradeBookController {

    private final GradeBookService gradeBookService;

    /** Student's own grades */
    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER') or hasRole('STUDENT')")
    public ResponseEntity<List<GradeEntryResponse>> forStudent(
            @PathVariable Long studentId,
            @RequestParam String academicYear) {
        return ResponseEntity.ok(gradeBookService.getForStudent(studentId, academicYear));
    }

    /** All grades for a class section — teacher/admin view */
    @GetMapping("/section/{sectionId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    public ResponseEntity<List<GradeEntryResponse>> forSection(
            @PathVariable Long sectionId,
            @RequestParam Integer term,
            @RequestParam String academicYear) {
        return ResponseEntity.ok(gradeBookService.getForSection(sectionId, term, academicYear));
    }

    /** Create or update a grade entry (upsert) */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    public ResponseEntity<GradeEntryResponse> upsert(@Valid @RequestBody GradeEntryRequest req,
                                                      Authentication auth) {
        return ResponseEntity.ok(gradeBookService.upsert(req, auth.getName()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        gradeBookService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
