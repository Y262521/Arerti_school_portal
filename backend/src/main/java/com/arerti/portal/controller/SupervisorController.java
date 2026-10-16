package com.arerti.portal.controller;

import com.arerti.portal.dto.GradeSectionResponse;
import com.arerti.portal.dto.SupervisorCreateRequest;
import com.arerti.portal.dto.SupervisorResponse;
import com.arerti.portal.service.SupervisorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/supervisors")
@RequiredArgsConstructor
public class SupervisorController {

    private final SupervisorService supervisorService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<SupervisorResponse>> list() {
        return ResponseEntity.ok(supervisorService.findAll());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SupervisorResponse> create(@Valid @RequestBody SupervisorCreateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(supervisorService.create(req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        supervisorService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/classes")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> assignClass(@PathVariable Long id,
                                             @RequestBody Map<String, Long> body) {
        Long sectionId = body.get("sectionId");
        if (sectionId == null) {
            return ResponseEntity.badRequest().build();
        }
        supervisorService.assignClass(id, sectionId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}/classes/{sectionId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> removeClass(@PathVariable Long id,
                                             @PathVariable Long sectionId) {
        supervisorService.removeClass(id, sectionId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/classes")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<GradeSectionResponse>> getAssignedClasses(@PathVariable Long id) {
        return ResponseEntity.ok(supervisorService.getAssignedClasses(id));
    }

    @GetMapping("/my-classes")
    @PreAuthorize("hasRole('SUPERVISOR')")
    public ResponseEntity<List<GradeSectionResponse>> myClasses(Authentication auth) {
        return ResponseEntity.ok(supervisorService.getMyClasses(auth.getName()));
    }
}
