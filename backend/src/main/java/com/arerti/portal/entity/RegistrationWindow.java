package com.arerti.portal.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.time.LocalDate;

/**
 * Director opens a registration window for a specific academic year.
 * Only one window can be OPEN at a time per academic year.
 * Teachers assigned to this window can register students for allowed grades.
 */
@Entity
@Table(name = "registration_windows")
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RegistrationWindow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "academic_year", nullable = false, length = 20)
    private String academicYear;          // e.g. "2026/2027"

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private WindowStatus status = WindowStatus.OPEN;

    /** Optional note from the director */
    @Column(length = 255)
    private String note;

    @Column(name = "opened_by", length = 80)
    private String openedBy;              // director username

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    public enum WindowStatus { OPEN, CLOSED }

    /** True if today is within the window dates and status is OPEN */
    public boolean isActive() {
        LocalDate today = LocalDate.now();
        return status == WindowStatus.OPEN
                && !today.isBefore(startDate)
                && !today.isAfter(endDate);
    }
}
