package com.arerti.portal.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

/**
 * Domain profile for a STUDENT user. The auth fields live on User.
 */
@Entity
@Table(name = "students",
        uniqueConstraints = @UniqueConstraint(columnNames = "student_uid"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Public ID a parent uses to link to their child, e.g. STU-2026-001 */
    @Column(name = "student_uid", nullable = false, length = 30)
    private String studentUid;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(length = 10)
    private String gender;

    @Column(name = "guardian_name", length = 120)
    private String guardianName;

    @Column(name = "guardian_phone", length = 20)
    private String guardianPhone;

    @Column(name = "enrollment_year")
    private Integer enrollmentYear;

    /** Many students belong to one section. Section entity arrives in Phase 2. */
    @Column(name = "section_id")
    private Long sectionId;
}
