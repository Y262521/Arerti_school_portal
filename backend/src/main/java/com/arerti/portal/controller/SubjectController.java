package com.arerti.portal.controller;

import com.arerti.portal.dto.SubjectRequest;
import com.arerti.portal.dto.SubjectResponse;
import com.arerti.portal.service.SubjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subjects")
@RequiredArgsConstructor
public class SubjectController {

    private final SubjectService subjectService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<SubjectResponse>> list() {
        return ResponseEntity.ok(subjectService.findAll());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    public ResponseEntity<SubjectResponse> create(@Valid @RequestBody SubjectRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(subjectService.create(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SubjectResponse> update(@PathVariable Long id,
                                                   @Valid @RequestBody SubjectRequest req) {
        return ResponseEntity.ok(subjectService.update(id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        subjectService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
