package com.arerti.portal.entity;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Append-only record of security-relevant or data-changing actions,
 * for admin visibility and basic accountability.
 */
@Document(collection = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    private String id;

    private String actorUsername;

    private String actorRole;

    /** e.g. LOGIN, LOGIN_FAILED, CREATE, UPDATE, DELETE, UPLOAD, DOWNLOAD, LINK, UNLINK */
    private String action;

    /** e.g. STUDENT, TEACHER, NOTICE, RESOURCE, PARENT_LINK, AUTH */
    private String entityType;

    private String entityId;

    /** Short human-readable summary, e.g. "Deleted student STU-2026-004" */
    private String details;

    @CreatedDate
    private Instant createdAt;
}
