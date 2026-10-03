package com.arerti.portal.controller;

import com.arerti.portal.dto.StudentCreateRequest;
import com.arerti.portal.dto.StudentUpdateRequest;
import com.arerti.portal.dto.StudentResponse;
import com.arerti.portal.service.StudentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    public ResponseEntity<List<StudentResponse>> list() {
        return ResponseEntity.ok(studentService.findAll());
    }

    /**
     * Lets a logged-in STUDENT fetch their own profile without needing the
     * admin/teacher-only list endpoint. Used by the "My Grades" page.
     */
    @GetMapping("/me")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<StudentResponse> me(Authentication auth) {
        return ResponseEntity.ok(studentService.findByUsername(auth.getName()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    public ResponseEntity<StudentResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(studentService.findById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StudentResponse> create(@Valid @RequestBody StudentCreateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(studentService.create(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StudentResponse> update(@PathVariable Long id,
                                                   @Valid @RequestBody StudentUpdateRequest req) {
        return ResponseEntity.ok(studentService.update(id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        studentService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
