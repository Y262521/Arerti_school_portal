package com.arerti.portal.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

/**
 * Links a teacher to a registration window with specific allowed grades.
 * A teacher may be assigned to register Grade 9 only, or 9+10, or all grades.
 * allowedGrades is stored as comma-separated integers e.g. "9,10,11,12"
 */
@Entity
@Table(name = "registration_assignments",
        uniqueConstraints = @UniqueConstraint(columnNames = {"window_id", "teacher_id"}))
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RegistrationAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "window_id", nullable = false)
    private RegistrationWindow window;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "teacher_id", nullable = false)
    private Teacher teacher;

    /**
     * Comma-separated grades this teacher is allowed to register.
     * e.g. "9" or "9,10" or "9,10,11,12"
     */
    @Column(name = "allowed_grades", nullable = false, length = 20)
    private String allowedGrades;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    /** Returns list of allowed grade integers */
    public java.util.List<Integer> getAllowedGradeList() {
        return java.util.Arrays.stream(allowedGrades.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(Integer::parseInt)
                .collect(java.util.stream.Collectors.toList());
    }
}
