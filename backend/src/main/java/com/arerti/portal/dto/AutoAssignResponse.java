package com.arerti.portal.dto;

import java.util.List;
import java.util.Map;

public record AutoAssignResponse(
        int totalStudents,
        int assignedStudents,
        int unassignedStudents,   // students with no score data
        Map<String, Integer> sectionCounts,  // sectionLabel → count
        String message
) {}
