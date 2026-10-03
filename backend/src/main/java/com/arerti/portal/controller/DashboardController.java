package com.arerti.portal.controller;

import com.arerti.portal.dto.DashboardStatsResponse;
import com.arerti.portal.service.GradeSectionService;
import com.arerti.portal.service.NoticeService;
import com.arerti.portal.service.StudentService;
import com.arerti.portal.service.TeacherService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final StudentService studentService;
    private final TeacherService teacherService;
    private final GradeSectionService gradeSectionService;
    private final NoticeService noticeService;

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DashboardStatsResponse> stats() {
        return ResponseEntity.ok(new DashboardStatsResponse(
                studentService.count(),
                teacherService.count(),
                gradeSectionService.count(),
                noticeService.count()
        ));
    }
}
