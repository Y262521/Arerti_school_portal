package com.arerti.portal.controller;

import com.arerti.portal.dto.ViceDirectorCreateRequest;
import com.arerti.portal.dto.ViceDirectorResponse;
import com.arerti.portal.service.ViceDirectorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vice-directors")
@RequiredArgsConstructor
public class ViceDirectorController {

    private final ViceDirectorService viceDirectorService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ViceDirectorResponse>> list() {
        return ResponseEntity.ok(viceDirectorService.findAll());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ViceDirectorResponse> create(@Valid @RequestBody ViceDirectorCreateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(viceDirectorService.create(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ViceDirectorResponse> update(@PathVariable Long id,
                                                        @Valid @RequestBody ViceDirectorCreateRequest req) {
        return ResponseEntity.ok(viceDirectorService.update(id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        viceDirectorService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
