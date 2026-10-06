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

    /** Save metadata only — file already uploaded to Cloudinary by the browser */
    @PostMapping(value = "/meta", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    public ResponseEntity<ResourceResponse> saveMeta(
            @RequestParam String downloadUrl,
            @RequestParam String fileName,
            @RequestParam(required = false) String contentType,
            @RequestParam(required = false) Long sizeBytes,
            @RequestParam String title,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String audience,
            @RequestParam(required = false) Long sectionId,
            @RequestParam(required = false) String subject) {
        ResourceResponse saved = resourceService.saveMeta(
                downloadUrl, fileName, contentType, sizeBytes,
                title, description, audience, sectionId, subject);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    /**
     * Download redirect — no auth required since Cloudinary URLs are public.
     * For legacy files, returns 410 Gone.
     */
    @GetMapping("/{id}/download")
    public ResponseEntity<Void> download(@PathVariable String id, Authentication auth) {
        // Log the download if authenticated
        if (auth != null) {
            resourceService.logDownload(id, auth.getName());
        }
        String url = resourceService.getDownloadUrl(id);
        if (url == null) {
            return ResponseEntity.status(HttpStatus.GONE).build();
        }
        return ResponseEntity.status(HttpStatus.FOUND)
                .location(java.net.URI.create(url))
                .build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    public ResponseEntity<Void> delete(@PathVariable String id, Authentication auth) {
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        resourceService.delete(id, auth.getName(), isAdmin);
        return ResponseEntity.noContent().build();
    }
}
