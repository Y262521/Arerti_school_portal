package com.arerti.portal.controller;

import com.arerti.portal.dto.GradeEntryRequest;
import com.arerti.portal.dto.GradeEntryResponse;
import com.arerti.portal.entity.GradeSection;
import com.arerti.portal.entity.Teacher;
import com.arerti.portal.repository.GradeSectionRepository;
import com.arerti.portal.repository.RegradePermissionRepository;
import com.arerti.portal.repository.TeacherRepository;
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
    private final TeacherRepository teacherRepository;
    private final GradeSectionRepository sectionRepository;
    private final RegradePermissionRepository regradePermissionRepository;

    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER') or hasRole('STUDENT')")
    public ResponseEntity<List<GradeEntryResponse>> forStudent(
            @PathVariable Long studentId,
            @RequestParam String academicYear) {
        return ResponseEntity.ok(gradeBookService.getForStudent(studentId, academicYear));
    }

    @GetMapping("/section/{sectionId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    public ResponseEntity<List<GradeEntryResponse>> forSection(
            @PathVariable Long sectionId,
            @RequestParam Integer term,
            @RequestParam String academicYear) {
        return ResponseEntity.ok(gradeBookService.getForSection(sectionId, term, academicYear));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    public ResponseEntity<GradeEntryResponse> upsert(@Valid @RequestBody GradeEntryRequest req,
                                                      Authentication auth) {
        boolean isAdmin = hasRole(auth, "ADMIN");

        // Check if there is an active regrade permission for this subject+section+term
        boolean isRegradeAllowed = false;
        if (!isAdmin) {
            Teacher teacher = teacherRepository.findByUser_Username(auth.getName()).orElse(null);
            if (teacher != null) {
                // Find the section from the student
                com.arerti.portal.entity.Student student =
                        null; // resolved in service, just check by subject+term here
                // Check regrade permission by teacher+subject+term+academicYear
                isRegradeAllowed = regradePermissionRepository
                        .findActiveByTeacherAndSubjectAndTerm(
                                teacher.getId(), req.subjectId(), req.term(), req.academicYear())
                        .isPresent();
            }
        }

        return ResponseEntity.ok(gradeBookService.upsert(req, auth.getName(), isAdmin, isRegradeAllowed));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication auth) {
        boolean isAdmin = hasRole(auth, "ADMIN");
        gradeBookService.delete(id, isAdmin);
        return ResponseEntity.noContent().build();
    }

    private boolean hasRole(Authentication auth, String role) {
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_" + role));
    }
}
