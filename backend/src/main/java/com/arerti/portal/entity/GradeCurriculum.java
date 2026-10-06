package com.arerti.portal.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

/**
 * Standard subject curriculum for a grade level.
 *
 * Grade 9 & 10: stream = null (all students share the same curriculum)
 * Grade 11 & 12: stream = NATURAL_SCIENCE or SOCIAL_SCIENCE
 *   - Each stream has its own set of subjects
 *   - When a Grade 11/12 class is created with a stream, only that stream's subjects apply
 */
@Entity
@Table(name = "grade_curricula",
        uniqueConstraints = @UniqueConstraint(columnNames = {"grade", "stream", "subject_id"}))
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class GradeCurriculum {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer grade;

    /**
     * Stream for this curriculum entry.
     * NULL  = applies to all (Grade 9 & 10)
     * NATURAL_SCIENCE or SOCIAL_SCIENCE = Grade 11 & 12 only
     */
    @Column(length = 30, columnDefinition = "VARCHAR(30) DEFAULT NULL")
    private String stream;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;
}
