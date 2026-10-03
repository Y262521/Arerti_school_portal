package com.arerti.portal.dto;

import com.arerti.portal.entity.Notice;

import java.time.Instant;

public record NoticeResponse(
        String id,
        String title,
        String body,
        String audience,
        String priority,
        boolean pinned,
        String postedBy,
        Instant createdAt,
        Instant updatedAt
) {
    public static NoticeResponse from(Notice n) {
        return new NoticeResponse(
                n.getId(), n.getTitle(), n.getBody(),
                n.getAudience(), n.getPriority(), n.isPinned(),
                n.getPostedBy(), n.getCreatedAt(), n.getUpdatedAt()
        );
    }
}
