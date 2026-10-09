package com.arerti.portal.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "teachers")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Teacher {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "employee_id", length = 30, unique = true)
    private String employeeId;

    // ── Personal info ──────────────────────────────────────────────────────────
    @Column(name = "first_name", length = 80, columnDefinition = "VARCHAR(80) DEFAULT NULL")
    private String firstName;

    @Column(name = "father_name", length = 80, columnDefinition = "VARCHAR(80) DEFAULT NULL")
    private String fatherName;

    @Column(name = "grandfather_name", length = 80, columnDefinition = "VARCHAR(80) DEFAULT NULL")
    private String grandfatherName;

    @Column(length = 10, columnDefinition = "VARCHAR(10) DEFAULT NULL")
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

    // ── Academic ────────────────────────────────────────────────────────────────
    @Column(length = 80)
    private String qualification;

    @Column(length = 80)
    private String specialization;

    @Column(name = "hire_date")
    private java.time.LocalDate hireDate;

    // ── Document URLs (Cloudinary) ─────────────────────────────────────────────
    @Column(name = "photo_url", length = 500, columnDefinition = "VARCHAR(500) DEFAULT NULL")
    private String photoUrl;

    @Column(name = "qualification_cert_url", length = 500, columnDefinition = "VARCHAR(500) DEFAULT NULL")
    private String qualificationCertUrl;

    @Column(name = "id_doc_url", length = 500, columnDefinition = "VARCHAR(500) DEFAULT NULL")
    private String idDocUrl;
}
