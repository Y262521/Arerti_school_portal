package com.arerti.portal.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

/**
 * Links a PARENT user account to one of their children's Student records.
 * A parent can have multiple links (multiple children); a student can in
 * principle be linked by more than one guardian account.
 */
@Entity
@Table(name = "parent_links",
        uniqueConstraints = @UniqueConstraint(columnNames = {"parent_user_id", "student_id"}))
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParentLink {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "parent_user_id", nullable = false)
    private User parent;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(name = "relationship", length = 40)
    private String relationship; // e.g. "Mother", "Father", "Guardian"

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
