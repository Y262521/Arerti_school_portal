package com.arerti.portal.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

/**
 * A single grade record: one student, one subject, one term, one academic year.
 */
@Entity
@Table(name = "grade_entries",
        uniqueConstraints = @UniqueConstraint(
                columnNames = {"student_id", "subject_id", "term", "academic_year"}))
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class GradeEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    /** 1, 2, or 3 (semester/term number) */
    @Column(nullable = false)
    private Integer term;

    @Column(name = "academic_year", nullable = false, length = 20)
    private String academicYear;

    /** Score out of 100 */
    @Column(nullable = false)
    private Double score;

    /** Optional comment from the teacher */
    @Column(length = 255)
    private String comment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recorded_by")
    private Teacher recordedBy;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;
}
