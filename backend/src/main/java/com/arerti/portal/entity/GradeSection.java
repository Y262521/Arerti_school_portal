package com.arerti.portal.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

/**
 * Represents a class/section, e.g. "Grade 9 – Section A" for a given academic year.
 */
@Entity
@Table(name = "grade_sections",
        uniqueConstraints = @UniqueConstraint(columnNames = {"grade", "section", "academic_year"}))
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GradeSection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** e.g. 9, 10, 11, 12 */
    @Column(nullable = false)
    private Integer grade;

    /** e.g. "A", "B", "C" */
    @Column(nullable = false, length = 10)
    private String section;

    /** e.g. "2025/2026" */
    @Column(name = "academic_year", nullable = false, length = 20)
    private String academicYear;

    /** Homeroom / class teacher */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "homeroom_teacher_id")
    private Teacher homeroomTeacher;

    @Column(name = "max_capacity")
    private Integer maxCapacity;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;
}
