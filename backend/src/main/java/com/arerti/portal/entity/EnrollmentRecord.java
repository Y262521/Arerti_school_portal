package com.arerti.portal.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

/**
 * Full enrollment record for every student registration event.
 * Covers: NEW (Grade 9 first-timer), REPEATER, PROMOTED, TRANSFER.
 * All file fields store Cloudinary HTTPS URLs.
 */
@Entity
@Table(name = "enrollment_records_v2",
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

    @Column(nullable = false)
    private Integer grade;

    // ── Student type ──────────────────────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(name = "enrollment_type", nullable = false, length = 20)
    private EnrollmentType enrollmentType;

    // ── Stream (Grade 11-12 only) ─────────────────────────────────────────────
    /** NATURAL_SCIENCE | SOCIAL_SCIENCE | null (for Grades 9-10) */
    @Column(length = 30)
    private String stream;

    // ── Personal info (new/transfer only) ────────────────────────────────────
    @Column(name = "first_name", length = 80)
    private String firstName;

    @Column(name = "father_name", length = 80)
    private String fatherName;

    @Column(name = "grandfather_name", length = 80)
    private String grandfatherName;

    @Column(length = 10)
    private String gender;

    @Column(name = "date_of_birth")
    private java.time.LocalDate dateOfBirth;

    @Column(length = 80)
    private String region;

    @Column(length = 80)
    private String city;

    @Column(length = 80)
    private String kebele;

    @Column(name = "house_no", length = 30)
    private String houseNo;

    // ── Cloudinary document URLs ───────────────────────────────────────────────
    @Column(name = "photo_url", length = 500)
    private String photoUrl;           // student photo

    @Column(name = "id_doc_url", columnDefinition = "TEXT")
    private String idDocUrl;           // resident ID / birth certificate (supports multiple photos)

    @Column(name = "grade8_certificate_url", columnDefinition = "TEXT")
    private String grade8CertificateUrl;  // Grade 8 transcript/certificate (supports multiple photos)

    @Column(name = "release_letter_url", columnDefinition = "TEXT")
    private String releaseLetterUrl;   // transfer release letter (supports multiple photos)

    @Column(name = "payment_receipt_url", columnDefinition = "TEXT")
    private String paymentReceiptUrl;  // bank/payment receipt photo (supports multiple photos)

    // ── Academic history ──────────────────────────────────────────────────────
    @Column(name = "grade8_score")
    private Double grade8Score;

    @Column(name = "previous_school", length = 200)
    private String previousSchool;

    // ── Payment ───────────────────────────────────────────────────────────────
    @Column(name = "bank_transaction_ref", length = 100)
    private String bankTransactionRef;

    @Column(name = "payment_method", length = 30)
    private String paymentMethod;     // TELEBIRR | CBE | BANK_TRANSFER

    // ── Parent/guardian ───────────────────────────────────────────────────────
    @Column(name = "parent_name", length = 120)
    private String parentName;

    @Column(name = "parent_relationship", length = 30)
    private String parentRelationship;  // Mother | Father | Uncle | Aunt | Other

    @Column(name = "parent_phone", length = 20)
    private String parentPhone;

    // ── Registration metadata ─────────────────────────────────────────────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "window_id")
    private RegistrationWindow window;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "registered_by")
    private Teacher registeredBy;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    public enum EnrollmentType {
        NEW,           // Grade 9 first-timer (never in system)
        PROMOTED,      // Moved up from previous grade (in system)
        REPEATER,      // Failed, staying in same grade (in system)
        TRANSFER       // Coming from another school (not in system)
    }
}
