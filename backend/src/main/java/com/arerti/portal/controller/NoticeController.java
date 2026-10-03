package com.arerti.portal.controller;

import com.arerti.portal.dto.NoticeRequest;
import com.arerti.portal.dto.NoticeResponse;
import com.arerti.portal.service.NoticeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notices")
@RequiredArgsConstructor
public class NoticeController {

    private final NoticeService noticeService;

    /** All authenticated users can read notices relevant to their role */
    @GetMapping
    public ResponseEntity<List<NoticeResponse>> list(Authentication auth) {
        String role = auth.getAuthorities().stream()
                .findFirst().map(a -> a.getAuthority().replace("ROLE_", ""))
                .orElse("GENERAL");
        // ADMIN sees all; others see GENERAL + their role
        if ("ADMIN".equals(role)) {
            return ResponseEntity.ok(noticeService.findAll());
        }
        return ResponseEntity.ok(noticeService.findForAudience(role));
    }

    @GetMapping("/{id}")
    public ResponseEntity<NoticeResponse> get(@PathVariable String id) {
        return ResponseEntity.ok(noticeService.findById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<NoticeResponse> create(@Valid @RequestBody NoticeRequest req,
                                                  Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(noticeService.create(req, auth.getName()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<NoticeResponse> update(@PathVariable String id,
                                                  @Valid @RequestBody NoticeRequest req) {
        return ResponseEntity.ok(noticeService.update(id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        noticeService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
