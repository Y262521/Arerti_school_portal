package com.arerti.portal.dto;

import com.arerti.portal.entity.ViceDirector;
import java.time.LocalDate;

public record ViceDirectorResponse(
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
    public static ViceDirectorResponse from(ViceDirector v) {
        return new ViceDirectorResponse(
                v.getId(), v.getEmployeeId(),
                v.getUser().getId(), v.getUser().getUsername(), v.getUser().getFullName(),
                v.getFirstName(), v.getFatherName(), v.getGrandfatherName(),
                v.getGender(), v.getDateOfBirth(),
                v.getUser().getEmail(), v.getUser().getPhone(),
                v.getPhotoUrl(), v.getQualificationCertUrl(), v.getIdDocUrl(),
                null, null
        );
    }

    public static ViceDirectorResponse fromWithCredentials(ViceDirector v, String genUsername, String genPassword) {
        return new ViceDirectorResponse(
                v.getId(), v.getEmployeeId(),
                v.getUser().getId(), v.getUser().getUsername(), v.getUser().getFullName(),
                v.getFirstName(), v.getFatherName(), v.getGrandfatherName(),
                v.getGender(), v.getDateOfBirth(),
                v.getUser().getEmail(), v.getUser().getPhone(),
                v.getPhotoUrl(), v.getQualificationCertUrl(), v.getIdDocUrl(),
                genUsername, genPassword
        );
    }
}
