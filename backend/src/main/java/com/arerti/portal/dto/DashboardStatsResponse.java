package com.arerti.portal.dto;

public record DashboardStatsResponse(
        long studentCount,
        long teacherCount,
        long classCount,
        long noticeCount
) {}
