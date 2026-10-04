package com.arerti.portal.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

/**
 * Defines the standard subject curriculum for a specific grade level.
 * e.g. Grade 9 → Mathematics, Physics, Chemistry, Biology, English, Amharic, etc.
 *
 * When a new class is created for a grade, the system auto-creates
 * ClassSubjectAssignment records for every subject in that grade's curriculum.
 * The teacher assignment is left blank and must be filled in by the admin.
 */
@Entity
@Table(name = "grade_curricula",
        uniqueConstraints = @UniqueConstraint(columnNames = {"grade", "subject_id"}))
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GradeCurriculum {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Grade level this curriculum entry applies to, e.g. 9, 10, 11, 12 */
    @Column(nullable = false)
    private Integer grade;

    /** The subject that is part of this grade's standard curriculum */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    /** Display order within the grade's curriculum */
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;
}
