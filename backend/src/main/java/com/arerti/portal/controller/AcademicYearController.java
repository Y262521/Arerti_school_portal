package com.arerti.portal.controller;

import com.arerti.portal.repository.EnrollmentRecordRepository;
import com.arerti.portal.repository.GradeEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/academic-years")
@RequiredArgsConstructor
public class AcademicYearController {

    private final EnrollmentRecordRepository enrollmentRecordRepository;
    private final GradeEntryRepository gradeEntryRepository;

    /**
     * Returns distinct academic years that exist in the database,
     * merged from enrollment records and grade entries, sorted descending.
     * Falls back to current year if no data exists yet.
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<String>> getAcademicYears() {
        Set<String> years = new LinkedHashSet<>();

        // From enrollment records
        years.addAll(enrollmentRecordRepository.findDistinctAcademicYears());

        // From grade entries
        years.addAll(gradeEntryRepository.findDistinctAcademicYears());

        // Always include the current year as a fallback
        int cy = java.time.LocalDate.now().getYear();
        years.add(cy + "/" + (cy + 1));

        // Sort descending
        List<String> sorted = years.stream()
                .filter(y -> y != null && !y.isBlank())
                .sorted((a, b) -> b.compareTo(a))
                .collect(Collectors.toList());

        return ResponseEntity.ok(sorted);
    }
}
