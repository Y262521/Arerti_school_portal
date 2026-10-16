package com.arerti.portal.dto;

import com.arerti.portal.entity.Supervisor;
import java.time.LocalDate;

public record SupervisorResponse(
        Long id,
        String employeeId,
        Long userId,
        String username,
        String fullName,
        String firstName,
        String fatherName,
        String grandfatherName,
        String gender,
        LocalDate dateOfBirth,
        String email,
        String phone,
        String photoUrl,
        String qualificationCertUrl,
        String idDocUrl,
        String generatedUsername,
        String generatedPassword
) {
    public static SupervisorResponse from(Supervisor s) {
        return new SupervisorResponse(
                s.getId(), s.getEmployeeId(),
                s.getUser().getId(), s.getUser().getUsername(), s.getUser().getFullName(),
                s.getFirstName(), s.getFatherName(), s.getGrandfatherName(),
                s.getGender(), s.getDateOfBirth(),
                s.getUser().getEmail(), s.getUser().getPhone(),
                s.getPhotoUrl(), s.getQualificationCertUrl(), s.getIdDocUrl(),
                null, null
        );
    }

    public static SupervisorResponse fromWithCredentials(Supervisor s, String genUsername, String genPassword) {
        return new SupervisorResponse(
                s.getId(), s.getEmployeeId(),
                s.getUser().getId(), s.getUser().getUsername(), s.getUser().getFullName(),
                s.getFirstName(), s.getFatherName(), s.getGrandfatherName(),
                s.getGender(), s.getDateOfBirth(),
                s.getUser().getEmail(), s.getUser().getPhone(),
                s.getPhotoUrl(), s.getQualificationCertUrl(), s.getIdDocUrl(),
                genUsername, genPassword
        );
    }
}
