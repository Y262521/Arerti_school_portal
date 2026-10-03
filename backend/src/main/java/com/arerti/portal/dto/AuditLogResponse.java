package com.arerti.portal.dto;

import com.arerti.portal.entity.AuditLog;

import java.time.Instant;

public record AuditLogResponse(
        String id,
        String actorUsername,
        String actorRole,
        String action,
        String entityType,
        String entityId,
        String details,
        Instant createdAt
) {
    public static AuditLogResponse from(AuditLog a) {
        return new AuditLogResponse(
                a.getId(), a.getActorUsername(), a.getActorRole(), a.getAction(),
                a.getEntityType(), a.getEntityId(), a.getDetails(), a.getCreatedAt()
        );
    }
}
