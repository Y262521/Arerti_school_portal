package com.arerti.portal.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

/**
 * Links a class/section to a subject AND the teacher responsible for teaching
 * that subject in that class. This record is NEVER deleted — it is the permanent
 * audit trail of "who taught what to whom and when".
 */
@Entity
@Table(name = "class_subject_assignments",
        uniqueConstraints = @UniqueConstraint(columnNames = {"section_id", "subject_id"}))
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClassSubjectAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "section_id", nullable = false)
    private GradeSection section;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    /** The teacher responsible for this subject in this class. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id")
    private Teacher teacher;

    /** Academic year this assignment was active, e.g. "2025/2026" */
    @Column(name = "academic_year", nullable = false, length = 20)
    private String academicYear;

    /** false = active; true = archived (end-of-year transition applied) */
    @Column(nullable = false)
    private boolean archived = false;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
