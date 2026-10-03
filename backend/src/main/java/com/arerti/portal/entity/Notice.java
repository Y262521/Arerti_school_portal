package com.arerti.portal.entity;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

/**
 * Stored in MongoDB — flexible rich-text notices with optional target audience.
 */
@Document(collection = "notices")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notice {

    @Id
    private String id;

    private String title;

    /** Rich text / plain text body */
    private String body;

    /** GENERAL | STUDENTS | TEACHERS | PARENTS */
    private String audience;

    /** Priority: LOW | MEDIUM | HIGH */
    private String priority;

    private boolean pinned;

    /** Username of the admin who posted it */
    private String postedBy;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
