package com.arerti.portal.controller;

import com.arerti.portal.dto.ResourceResponse;
import com.arerti.portal.service.ResourceService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
public class ResourceController {

    private final ResourceService resourceService;

    /** All authenticated users can browse resources relevant to their role. */
    @GetMapping
    public ResponseEntity<List<ResourceResponse>> list(Authentication auth) {
        String role = auth.getAuthorities().stream()
                .findFirst().map(a -> a.getAuthority().replace("ROLE_", ""))
                .orElse("GENERAL");
        if ("ADMIN".equals(role)) {
            return ResponseEntity.ok(resourceService.findAll());
        }
        return ResponseEntity.ok(resourceService.findForAudience(role, auth.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResourceResponse> get(@PathVariable String id) {
        return ResponseEntity.ok(resourceService.findById(id));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    public ResponseEntity<ResourceResponse> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam String title,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String audience,
            @RequestParam(required = false) Long sectionId,
            @RequestParam(required = false) String subject) {
        ResourceResponse saved = resourceService.upload(file, title, description, audience, sectionId, subject);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> download(@PathVariable String id) {
        ResourceResponse meta = resourceService.metaOf(id);
        Resource file = resourceService.download(id);
        MediaType type = meta.contentType() != null
                ? MediaType.parseMediaType(meta.contentType())
                : MediaType.APPLICATION_OCTET_STREAM;
        return ResponseEntity.ok()
                .contentType(type)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + meta.fileName() + "\"")
                .body(file);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        resourceService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
