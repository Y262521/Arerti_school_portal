package com.arerti.portal.controller;

import com.arerti.portal.dto.ReportCardResponse;
import com.arerti.portal.repository.ParentLinkRepository;
import com.arerti.portal.repository.UserRepository;
import com.arerti.portal.service.ReportCardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/report-card")
@RequiredArgsConstructor
public class ReportCardController {

    private final ReportCardService reportCardService;
    private final ParentLinkRepository parentLinkRepository;
    private final UserRepository userRepository;

    @GetMapping("/{studentId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER') or hasRole('STUDENT') or hasRole('PARENT')")
    public ResponseEntity<ReportCardResponse> generate(
            @PathVariable Long studentId,
            @RequestParam(defaultValue = "1") Integer term,
            @RequestParam String academicYear,
            Authentication auth) {
        boolean isParent = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_PARENT"));
        if (isParent) {
            Long parentId = userRepository.findByUsername(auth.getName())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unknown user"))
                    .getId();
            if (!parentLinkRepository.existsByParentIdAndStudentId(parentId, studentId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This student is not linked to your account");
            }
        }
        return ResponseEntity.ok(reportCardService.generate(studentId, term, academicYear));
    }
}
