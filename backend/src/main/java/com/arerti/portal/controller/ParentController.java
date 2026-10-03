package com.arerti.portal.controller;

import com.arerti.portal.dto.ParentLinkRequest;
import com.arerti.portal.dto.ParentLinkResponse;
import com.arerti.portal.service.ParentLinkService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/parent")
@RequiredArgsConstructor
@PreAuthorize("hasRole('PARENT')")
public class ParentController {

    private final ParentLinkService parentLinkService;

    @GetMapping("/children")
    public ResponseEntity<List<ParentLinkResponse>> children(Authentication auth) {
        return ResponseEntity.ok(parentLinkService.findChildren(auth.getName()));
    }

    @PostMapping("/link")
    public ResponseEntity<ParentLinkResponse> link(@Valid @RequestBody ParentLinkRequest req,
                                                     Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(parentLinkService.link(auth.getName(), req));
    }

    @DeleteMapping("/link/{linkId}")
    public ResponseEntity<Void> unlink(@PathVariable Long linkId, Authentication auth) {
        parentLinkService.unlink(auth.getName(), linkId);
        return ResponseEntity.noContent().build();
    }
}
