package com.arerti.portal.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "students",
        uniqueConstraints = @UniqueConstraint(columnNames = "student_uid"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_uid", nullable = false, length = 30)
    private String studentUid;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(length = 10)
    private String gender;

    // ── Registration name parts ──────────────────────────────────────────────
    @Column(name = "first_name", length = 80)
    private String firstName;

    @Column(name = "father_name", length = 80)
    private String fatherName;

    @Column(name = "grandfather_name", length = 80)
    private String grandfatherName;

    // ── Address ──────────────────────────────────────────────────────────────
    @Column(length = 80)
    private String region;

    @Column(length = 80)
    private String city;

    @Column(length = 80)
    private String kebele;

    @Column(name = "house_no", length = 30)
    private String houseNo;

    // ── Guardian / Parent ────────────────────────────────────────────────────
    @Column(name = "guardian_name", length = 120)
    private String guardianName;

    @Column(name = "guardian_phone", length = 20)
    private String guardianPhone;

    @Column(name = "parent_relationship", length = 30)
    private String parentRelationship;

    // ── Academic & Placement ─────────────────────────────────────────────────
    @Column(name = "enrollment_year")
    private Integer enrollmentYear;

    @Column(name = "academic_year", length = 20)
    private String academicYear;

    @Column(name = "target_grade")
    private Integer grade;

    @Column(name = "enrollment_type", length = 20)
    private String enrollmentType;

    /** Academic stream — set for Grade 11-12 students: NATURAL_SCIENCE | SOCIAL_SCIENCE */
    @Column(name = "current_stream", length = 30, columnDefinition = "VARCHAR(30) DEFAULT NULL")
    private String currentStream;

    @Column(name = "section_id")
    private Long sectionId;

    @Column(name = "previous_school", length = 200)
    private String previousSchool;

    @Column(name = "grade8_score")
    private Double grade8Score;

    // ── Payment ──────────────────────────────────────────────────────────────
    @Column(name = "payment_method", length = 30)
    private String paymentMethod;

    @Column(name = "bank_transaction_ref", length = 100)
    private String bankTransactionRef;

    // ── Document URLs (Cloudinary) ────────────────────────────────────────────
    /** Denormalized photo URL from Cloudinary for quick display */
    @Column(name = "photo_url", length = 500)
    private String photoUrl;

    @Column(name = "id_doc_url", columnDefinition = "TEXT")
    private String idDocUrl;

    @Column(name = "grade8_certificate_url", columnDefinition = "TEXT")
    private String grade8CertificateUrl;

    @Column(name = "release_letter_url", columnDefinition = "TEXT")
    private String releaseLetterUrl;

    @Column(name = "payment_receipt_url", columnDefinition = "TEXT")
    private String paymentReceiptUrl;
}
