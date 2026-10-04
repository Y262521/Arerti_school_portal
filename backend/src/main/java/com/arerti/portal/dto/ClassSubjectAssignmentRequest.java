package com.arerti.portal.dto;

import jakarta.validation.constraints.NotNull;

public record ClassSubjectAssignmentRequest(
        @NotNull Long subjectId,
        Long teacherId          // nullable — can be assigned later
) {}
