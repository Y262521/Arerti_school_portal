package com.arerti.portal.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "vice_directors")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ViceDirector {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "employee_id", length = 20, unique = true)
    private String employeeId;

    @Column(name = "first_name", length = 80)
    private String firstName;

    @Column(name = "father_name", length = 80)
    private String fatherName;

    @Column(name = "grandfather_name", length = 80)
    private String grandfatherName;

    @Column(length = 10)
    private String gender;

    @Column(name = "date_of_birth")
    private java.time.LocalDate dateOfBirth;

    @Column(name = "photo_url", length = 500)
    private String photoUrl;

    @Column(name = "qualification_cert_url", columnDefinition = "TEXT")
    private String qualificationCertUrl;

    @Column(name = "id_doc_url", columnDefinition = "TEXT")
    private String idDocUrl;
}
