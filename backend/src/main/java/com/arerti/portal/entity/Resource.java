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

    /** Optional: restrict to a grade section, e.g. "Grade 9 - A" */
    private Long sectionId;

    /** Optional free-text subject label, e.g. "Mathematics" */
    private String subject;

    /** Original filename as uploaded by the user */
    private String fileName;

    /** UUID-based name the file is actually stored under on disk */
    private String storedFileName;

    private String contentType;

    private long sizeBytes;

    /** Username of the teacher/admin who uploaded it */
    private String uploadedBy;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
