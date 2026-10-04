package com.arerti.portal.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

/**
 * Admin grants a homeroom teacher permission to edit a specific subject's marks
 * for a specific class/section/term.
 *
 * Flow:
 *  1. Homeroom teacher requests regrade (status = PENDING)
 *  2. Admin approves (status = APPROVED) or rejects (status = REJECTED)
 *  3. Homeroom teacher edits the mark — service auto-revokes (status = USED)
 */
@Entity
@Table(name = "regrade_permissions")
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RegradePermission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The homeroom teacher requesting/receiving the permission */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "teacher_id", nullable = false)
    private Teacher teacher;

    /** The subject whose marks need correction */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    /** The class section involved */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "section_id", nullable = false)
    private GradeSection section;

    @Column(nullable = false)
    private Integer term;

    @Column(name = "academic_year", nullable = false, length = 20)
    private String academicYear;

    /** Reason provided by homeroom teacher when requesting */
    @Column(length = 500)
    private String reason;

    /** Admin's note when approving or rejecting */
    @Column(name = "admin_note", length = 500)
    private String adminNote;

    /**
     * PENDING → APPROVED → USED (auto after edit)
     * PENDING → REJECTED
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RegradeStatus status = RegradeStatus.PENDING;

    @Column(name = "granted_by")
    private String grantedBy;   // admin username

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    public enum RegradeStatus {
        PENDING, APPROVED, REJECTED, USED
    }
}
