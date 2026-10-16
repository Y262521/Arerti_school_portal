package com.arerti.portal.controller;

import com.arerti.portal.dto.GradeSectionRequest;
import com.arerti.portal.dto.GradeSectionResponse;
import com.arerti.portal.service.GradeSectionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/classes")
@RequiredArgsConstructor
public class GradeSectionController {

    private final GradeSectionService gradeSectionService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('VICE_DIRECTOR') or hasRole('TEACHER')")
    public ResponseEntity<List<GradeSectionResponse>> list() {
        return ResponseEntity.ok(gradeSectionService.findAll());
    }

    /** Returns only the classes where the logged-in teacher is the homeroom teacher */
    @GetMapping("/my-classes")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<List<GradeSectionResponse>> myClasses(Authentication auth) {
        return ResponseEntity.ok(gradeSectionService.findMyClasses(auth.getName()));
    }

    /** Returns classes assigned to the logged-in supervisor */
    @GetMapping("/my-supervised")
    @PreAuthorize("hasRole('SUPERVISOR')")
    public ResponseEntity<List<GradeSectionResponse>> mySupervisedClasses(Authentication auth) {
        return ResponseEntity.ok(gradeSectionService.findSupervisedClasses(auth.getName()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('VICE_DIRECTOR') or hasRole('TEACHER') or hasRole('SUPERVISOR')")
    public ResponseEntity<GradeSectionResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(gradeSectionService.findById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('VICE_DIRECTOR')")
    public ResponseEntity<GradeSectionResponse> create(@Valid @RequestBody GradeSectionRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(gradeSectionService.create(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('VICE_DIRECTOR')")
    public ResponseEntity<GradeSectionResponse> update(@PathVariable Long id,
                                                        @Valid @RequestBody GradeSectionRequest req) {
        return ResponseEntity.ok(gradeSectionService.update(id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('VICE_DIRECTOR')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        gradeSectionService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
