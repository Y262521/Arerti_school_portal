package com.arerti.portal.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

/**
 * One grade record: student × subject × term × academicYear.
 *
 * Mark breakdown (total = 100):
 *   midExam    – out of 20
 *   finalExam  – out of 60
 *   assignment – out of 10  (Assignment / Group Work)
 *   testQuiz   – out of 10  (Test / Quiz)
 *   score      – computed sum, used by report card
 *
 * Edit rules:
 *   - Subject teacher: can enter marks for their assigned subject (first save sets recordedBy).
 *     After saving they CANNOT edit — read-only.
 *   - Homeroom teacher: can enter marks for THEIR assigned subject like any subject teacher.
 *     Can also view all other subjects (read-only).
 *     Can edit ANY subject's marks ONLY when admin has granted a RegradePermission.
 *   - Admin: can edit anything at any time.
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

    @Column(nullable = false)
    private Integer term;

    @Column(name = "academic_year", nullable = false, length = 20)
    private String academicYear;

    // ── Mark components ──────────────────────────────────────────────────────
    @Column(name = "mid_exam")
    private Double midExam;        // out of 20

    @Column(name = "final_exam")
    private Double finalExam;      // out of 60

    @Column(name = "assignment")
    private Double assignment;     // out of 10

    @Column(name = "test_quiz")
    private Double testQuiz;       // out of 10

    /** Computed total (sum of components, max 100). Updated by recalculateScore(). */
    @Column(nullable = false, columnDefinition = "DOUBLE DEFAULT 0")
    private Double score = 0.0;

    @Column(length = 500)
    private String comment;

    /**
     * true = marks are locked (subject teacher entered them).
     * homeroom teacher can only edit if a RegradePermission exists.
     */
    @Column(nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    private boolean locked = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recorded_by")
    private Teacher recordedBy;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;

    /** Recomputes score from components. Call before every save. */
    public void recalculateScore() {
        double total = 0;
        if (midExam    != null) total += midExam;
        if (finalExam  != null) total += finalExam;
        if (assignment != null) total += assignment;
        if (testQuiz   != null) total += testQuiz;
        this.score = Math.min(total, 100.0);
    }
}
