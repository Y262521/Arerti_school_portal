package com.arerti.portal.entity;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Metadata for an uploaded learning resource (PDF, doc, slide, etc).
 * The binary file itself lives on disk under app.storage.resources-dir;
 * this document only stores metadata + the generated storage key.
 */
@Document(collection = "resources")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Resource {

    @Id
    private String id;

    private String title;

    private String description;

    /** GENERAL | STUDENTS | TEACHERS | PARENTS */
    private String audience;

    private Long sectionId;

    private String subject;

    private String fileName;

    /**
     * For old resources: UUID-based filename on GridFS.
     * For new resources: Cloudinary secure_url (starts with https://).
     */
    private String storedFileName;

    /** Direct Cloudinary HTTPS URL — set for new uploads, null for legacy */
    private String downloadUrl;

    private String contentType;

    private long sizeBytes;

    private String uploadedBy;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    /** Returns true if this resource has a direct download URL (Cloudinary) */
    public boolean hasDirectUrl() {
        return downloadUrl != null && !downloadUrl.isBlank();
    }
}
