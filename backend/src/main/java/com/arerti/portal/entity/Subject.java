package com.arerti.portal.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * A subject taught in the school, e.g. Mathematics, Physics.
 * The same subject name can exist multiple times with different codes
 * (e.g. Biology [BIO-NS] for Natural Science, Biology [BIO-SS] for Social Science).
 * Code uniqueness is enforced only when a code is provided (NULLs are excluded from unique check).
 */
@Entity
@Table(name = "subjects")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Subject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Subject name — not unique, same name can appear with different codes */
    @Column(nullable = false, length = 80)
    private String name;

    /** Subject code — unique when provided (NULL allowed for unnamed variants) */
    @Column(length = 20, unique = true)
    private String code;

    /** Grades this subject is taught in, stored as comma-separated e.g. "9,10,11,12" */
    @Column(name = "applicable_grades", length = 20)
    private String applicableGrades;
}
