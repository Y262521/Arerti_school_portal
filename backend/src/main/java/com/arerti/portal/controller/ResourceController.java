package com.arerti.portal.controller;

import com.arerti.portal.dto.ResourceResponse;
import com.arerti.portal.service.ResourceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
public class ResourceController {

    private final ResourceService resourceService;

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

    /**
     * Download endpoint — redirects to Cloudinary URL directly.
     * For legacy files that no longer exist, returns 404.
     */
    @GetMapping("/{id}/download")
    public ResponseEntity<Void> download(@PathVariable String id) {
        String url = resourceService.getDownloadUrl(id);
        if (url == null) {
            return ResponseEntity.status(HttpStatus.GONE).build(); // file no longer available
        }
        // Redirect browser directly to Cloudinary — no backend streaming needed
        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(url))
                .build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        resourceService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
