package com.arerti.portal.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.time.LocalDate;

/**
 * Daily attendance record for a teacher (staff).
 */
@Entity
@Table(name = "staff_attendance",
       uniqueConstraints = @UniqueConstraint(columnNames = {"teacher_id", "date"}))
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StaffAttendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "teacher_id", nullable = false)
    private Teacher teacher;

    @Column(nullable = false)
    private LocalDate date;

    /** PRESENT | ABSENT | LATE | EXCUSED */
    @Column(nullable = false, length = 10)
    private String status;

    @Column(length = 300)
    private String note;

    /** Username of the admin who marked this entry */
    @Column(name = "marked_by", length = 80)
    private String markedBy;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
