package com.arerti.portal.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "teachers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Teacher {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "employee_id", length = 30, unique = true)
    private String employeeId;

    @Column(length = 80)
    private String qualification;

    @Column(length = 80)
    private String specialization;

    @Column(name = "hire_date")
    private java.time.LocalDate hireDate;
}
