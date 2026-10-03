package com.arerti.portal.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * A subject taught in the school, e.g. Mathematics, Physics.
 */
@Entity
@Table(name = "subjects")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Subject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80, unique = true)
    private String name;

    @Column(length = 10)
    private String code;

    /** Grades this subject is taught in, stored as comma-separated e.g. "9,10,11,12" */
    @Column(name = "applicable_grades", length = 20)
    private String applicableGrades;
}
