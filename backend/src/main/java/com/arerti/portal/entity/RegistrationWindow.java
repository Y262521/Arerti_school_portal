package com.arerti.portal.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.time.LocalDateTime;

/**
 * Director opens a registration window with start/end datetime.
 * Can be postponed (end datetime extended) by the director.
 */
@Entity
@Table(name = "registration_windows_v2")
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RegistrationWindow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "academic_year", nullable = false, length = 20)
    private String academicYear;

    /** Registration opens at this exact date and time */
    @Column(name = "start_datetime", nullable = false)
    private LocalDateTime startDatetime;

    /** Registration closes at this exact date and time (can be postponed) */
    @Column(name = "end_datetime", nullable = false)
    private LocalDateTime endDatetime;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private WindowStatus status = WindowStatus.OPEN;

    @Column(length = 500)
    private String note;

    @Column(name = "opened_by", length = 80)
    private String openedBy;

    /** Tracks how many times the window was postponed */
    @Column(name = "postpone_count", nullable = false)
    private int postponeCount = 0;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    public enum WindowStatus { OPEN, CLOSED }

    /** True if current datetime is within the window and status is OPEN */
    public boolean isActive() {
        LocalDateTime now = LocalDateTime.now();
        return status == WindowStatus.OPEN
                && !now.isBefore(startDatetime)
                && !now.isAfter(endDatetime);
    }
}
