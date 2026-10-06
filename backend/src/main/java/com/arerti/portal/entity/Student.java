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

    @Column(name = "guardian_name", length = 120)
    private String guardianName;

    @Column(name = "guardian_phone", length = 20)
    private String guardianPhone;

    @Column(name = "enrollment_year")
    private Integer enrollmentYear;

    /** Academic stream — set for Grade 11-12 students: NATURAL_SCIENCE | SOCIAL_SCIENCE */
    @Column(name = "current_stream", length = 30, columnDefinition = "VARCHAR(30) DEFAULT NULL")
    private String currentStream;

    @Column(name = "section_id")
    private Long sectionId;

    /** Denormalized photo URL from Cloudinary for quick display */
    @Column(name = "photo_url", length = 500)
    private String photoUrl;
}
