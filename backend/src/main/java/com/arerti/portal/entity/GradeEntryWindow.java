package com.arerti.portal.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.time.LocalDateTime;

/**
 * Director opens a grade entry window after final exams.
 * Teachers can only enter/edit grades during an open window.
 * Director can extend (postpone) the window.
 */
@Entity
@Table(name = "grade_entry_windows")
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class GradeEntryWindow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "academic_year", nullable = false, length = 20)
    private String academicYear;

    @Column(nullable = false)
    private Integer semester;             // 1 or 2

    @Column(name = "start_datetime", nullable = false)
    private LocalDateTime startDatetime;

    @Column(name = "end_datetime", nullable = false)
    private LocalDateTime endDatetime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private WindowStatus status = WindowStatus.OPEN;

    @Column(length = 500)
    private String note;

    @Column(name = "opened_by", length = 80)
    private String openedBy;

    @Column(name = "postpone_count", nullable = false)
    private int postponeCount = 0;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    public enum WindowStatus { OPEN, CLOSED }

    public boolean isActive() {
        LocalDateTime now = LocalDateTime.now();
        return status == WindowStatus.OPEN
                && !now.isBefore(startDatetime)
                && !now.isAfter(endDatetime);
    }
}
