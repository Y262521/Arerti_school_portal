package com.arerti.portal.controller;

import com.arerti.portal.dto.RegradePermissionRequest;
import com.arerti.portal.dto.RegradePermissionResponse;
import com.arerti.portal.service.RegradeService;
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
@RequestMapping("/api/regrade")
@RequiredArgsConstructor
public class RegradeController {

    private final RegradeService regradeService;

    /** Homeroom teacher submits a regrade request */
    @PostMapping("/request")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<RegradePermissionResponse> request(
            @Valid @RequestBody RegradePermissionRequest req,
            Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(regradeService.request(auth.getName(), req));
    }

    /** Teacher views their own requests */
    @GetMapping("/my-requests")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<List<RegradePermissionResponse>> myRequests(Authentication auth) {
        return ResponseEntity.ok(regradeService.findMyRequests(auth.getName()));
    }

    /** Admin views all requests */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<RegradePermissionResponse>> all() {
        return ResponseEntity.ok(regradeService.findAll());
    }

    /** Admin views only pending */
    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<RegradePermissionResponse>> pending() {
        return ResponseEntity.ok(regradeService.findPending());
    }

    /** Admin approves a request */
    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RegradePermissionResponse> approve(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            Authentication auth) {
        String note = body != null ? body.get("adminNote") : null;
        return ResponseEntity.ok(regradeService.resolve(id, true, note, auth.getName()));
    }

    /** Admin rejects a request */
    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RegradePermissionResponse> reject(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            Authentication auth) {
        String note = body != null ? body.get("adminNote") : null;
        return ResponseEntity.ok(regradeService.resolve(id, false, note, auth.getName()));
    }
}
