package com.arerti.portal.dto;

import com.arerti.portal.entity.Resource;

import java.time.Instant;

public record ResourceResponse(
        String id,
        String title,
        String description,
        String audience,
        Long sectionId,
        String subject,
        String fileName,
        String contentType,
        long sizeBytes,
        String uploadedBy,
        Instant createdAt,
        Instant updatedAt
) {
    public static ResourceResponse from(Resource r) {
        return new ResourceResponse(
                r.getId(), r.getTitle(), r.getDescription(), r.getAudience(),
                r.getSectionId(), r.getSubject(), r.getFileName(), r.getContentType(),
                r.getSizeBytes(), r.getUploadedBy(), r.getCreatedAt(), r.getUpdatedAt()
        );
    }
}
