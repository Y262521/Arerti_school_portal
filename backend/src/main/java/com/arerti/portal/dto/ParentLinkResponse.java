package com.arerti.portal.dto;

import com.arerti.portal.entity.ParentLink;

import java.time.Instant;

public record ParentLinkResponse(
        Long linkId,
        Long studentId,
        String studentUid,
        String studentFullName,
        String sectionLabel,
        String relationship,
        Instant linkedAt
) {
    public static ParentLinkResponse from(ParentLink link, String sectionLabel) {
        return new ParentLinkResponse(
                link.getId(),
                link.getStudent().getId(),
                link.getStudent().getStudentUid(),
                link.getStudent().getUser().getFullName(),
                sectionLabel,
                link.getRelationship(),
                link.getCreatedAt()
        );
    }
}
