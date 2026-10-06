package com.arerti.portal.controller;

import com.arerti.portal.dto.ClassSubjectAssignmentRequest;
import com.arerti.portal.dto.ClassSubjectAssignmentResponse;
import com.arerti.portal.dto.GradeCurriculumResponse;
import com.arerti.portal.service.ClassSubjectAssignmentService;
import com.arerti.portal.service.StudentService;
import com.arerti.portal.repository.StudentRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class ClassSubjectAssignmentController {

    private final ClassSubjectAssignmentService assignmentService;
    private final StudentRepository studentRepository;

    // ----------------------------------------------------------------
    // Grade curriculum management  (ADMIN only)
    // GET  /api/curriculum/{grade}
    // POST /api/curriculum/{grade}/subjects
    // DELETE /api/curriculum/{grade}/subjects/{subjectId}
    // ----------------------------------------------------------------

    @GetMapping("/api/curriculum/{grade}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    public ResponseEntity<List<GradeCurriculumResponse>> getCurriculum(
            @PathVariable Integer grade,
            @RequestParam(required = false) String stream) {
        return ResponseEntity.ok(assignmentService.getCurriculum(grade, stream));
    }

    @PostMapping("/api/curriculum/{grade}/subjects")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<GradeCurriculumResponse> addToCurriculum(
            @PathVariable Integer grade,
            @RequestParam Long subjectId,
            @RequestParam(required = false) String stream) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(assignmentService.addToCurriculum(grade, subjectId, stream));
    }

    @DeleteMapping("/api/curriculum/{grade}/subjects/{subjectId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> removeFromCurriculum(
            @PathVariable Integer grade,
            @PathVariable Long subjectId,
            @RequestParam(required = false) String stream) {
        assignmentService.removeFromCurriculum(grade, subjectId, stream);
        return ResponseEntity.noContent().build();
    }

    // ----------------------------------------------------------------
    // Per-class subject-teacher assignments
    // GET    /api/classes/{sectionId}/assignments      — active only
    // GET    /api/classes/{sectionId}/assignments/all  — incl. archived
    // PUT    /api/classes/{sectionId}/assignments      — assign/update teacher
    // DELETE /api/classes/{sectionId}/assignments/{id} — always 403
    // ----------------------------------------------------------------

    @GetMapping("/api/classes/{sectionId}/assignments")
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    public ResponseEntity<List<ClassSubjectAssignmentResponse>> list(@PathVariable Long sectionId) {
        return ResponseEntity.ok(assignmentService.getForSection(sectionId));
    }

    @GetMapping("/api/classes/{sectionId}/assignments/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ClassSubjectAssignmentResponse>> listAll(@PathVariable Long sectionId) {
        return ResponseEntity.ok(assignmentService.getAllForSection(sectionId));
    }

    @PutMapping("/api/classes/{sectionId}/assignments")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ClassSubjectAssignmentResponse> assign(
            @PathVariable Long sectionId,
            @Valid @RequestBody ClassSubjectAssignmentRequest req) {
        return ResponseEntity.ok(assignmentService.assign(sectionId, req));
    }

    /** Assignments are never deleted — return 403 always */
    @DeleteMapping("/api/classes/{sectionId}/assignments/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long sectionId, @PathVariable Long id) {
        assignmentService.protectDelete();
        return ResponseEntity.noContent().build(); // never reached
    }

    // ----------------------------------------------------------------
    // End Term  POST /api/classes/end-term
    // Archives all assignments + unassigns all students for the year
    // ----------------------------------------------------------------

    @PostMapping("/api/classes/end-term")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> endTerm(@RequestParam String academicYear) {
        int archivedAssignments = assignmentService.endTerm(academicYear);

        // Unassign all students from their sections for this year
        var students = studentRepository.findAll().stream()
                .filter(s -> s.getSectionId() != null)
                .toList();
        students.forEach(s -> s.setSectionId(null));
        studentRepository.saveAll(students);

        return ResponseEntity.ok(Map.of(
                "message", "Term ended for academic year " + academicYear,
                "archivedAssignments", archivedAssignments,
                "studentsUnassigned", students.size()
        ));
    }
}
