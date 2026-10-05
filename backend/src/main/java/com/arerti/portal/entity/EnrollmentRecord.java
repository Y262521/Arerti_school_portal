package com.arerti.portal.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

/**
 * Tracks each student's enrollment/re-enrollment for an academic year.
 * For Grade 9: full registration. For Grade 10-12: re-enrollment with bank receipt.
 */
@Entity
@Table(name = "enrollment_records",
        uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "academic_year"}))
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EnrollmentRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(name = "academic_year", nullable = false, length = 20)
    private String academicYear;

    /** Grade the student is enrolling INTO */
    @Column(nullable = false)
    private Integer grade;

    /** Bank transaction / payment receipt number */
    @Column(name = "bank_transaction_ref", nullable = false, length = 100)
    private String bankTransactionRef;

    /** Which registration window was used */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "window_id")
    private RegistrationWindow window;

    /** Teacher who registered this student */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "registered_by")
    private Teacher registeredBy;

    /** NEW = first-time Grade 9, RE_ENROLLMENT = returning student */
    @Enumerated(EnumType.STRING)
    @Column(name = "enrollment_type", nullable = false, length = 20)
    private EnrollmentType enrollmentType;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    public enum EnrollmentType { NEW, RE_ENROLLMENT }
}
