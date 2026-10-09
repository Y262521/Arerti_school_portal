package com.arerti.portal.dto;

import com.arerti.portal.entity.EnrollmentRecord;
import com.arerti.portal.entity.Student;

import java.time.LocalDate;

public record StudentResponse(
        Long id,
        String studentUid,
        Long userId,
        String username,
        String fullName,
        String firstName,
        String fatherName,
        String grandfatherName,
        String email,
        String phone,
        LocalDate dateOfBirth,
        String gender,
        String region,
        String city,
        String kebele,
        String houseNo,
        String parentName,        // renamed from guardianName
        String parentRelationship,
        String parentPhone,
        Integer enrollmentYear,
        String academicYear,
        Integer grade,
        Long sectionId,
        String sectionLabel,
        String stream,
        String enrollmentType,
        String previousSchool,
        Double grade8Score,
        String paymentMethod,
        String bankTransactionRef,
        String photoUrl,          // Cloudinary URL
        String idDocUrl,
        String grade8CertificateUrl,
        String releaseLetterUrl,
        String paymentReceiptUrl,
        // Only set on creation — contains the auto-generated plain-text credentials for admin to share
        String generatedUsername,
        String generatedPassword
) {
    public static StudentResponse from(Student s, String sectionLabel) {
        return from(s, sectionLabel, null, null, null);
    }

    public static StudentResponse from(Student s, String sectionLabel, EnrollmentRecord rec) {
        return from(s, sectionLabel, rec, null, null);
    }

    public static StudentResponse fromWithCredentials(Student s, String sectionLabel,
                                                       String genUsername, String genPassword) {
        return from(s, sectionLabel, null, genUsername, genPassword);
    }

    public static StudentResponse from(Student s, String sectionLabel, EnrollmentRecord rec,
                                        String genUsername, String genPassword) {
        String fn = s.getFirstName() != null ? s.getFirstName() : (rec != null ? rec.getFirstName() : null);
        String fatN = s.getFatherName() != null ? s.getFatherName() : (rec != null ? rec.getFatherName() : null);
        String gfN = s.getGrandfatherName() != null ? s.getGrandfatherName() : (rec != null ? rec.getGrandfatherName() : null);
        if (fn == null && s.getUser() != null && s.getUser().getFullName() != null) {
            String[] parts = s.getUser().getFullName().trim().split("\\s+");
            if (parts.length > 0) fn = parts[0];
            if (parts.length > 1) fatN = parts[1];
            if (parts.length > 2) gfN = parts[2];
        }

        String region = s.getRegion() != null ? s.getRegion() : (rec != null ? rec.getRegion() : null);
        String city = s.getCity() != null ? s.getCity() : (rec != null ? rec.getCity() : null);
        String kebele = s.getKebele() != null ? s.getKebele() : (rec != null ? rec.getKebele() : null);
        String houseNo = s.getHouseNo() != null ? s.getHouseNo() : (rec != null ? rec.getHouseNo() : null);

        String parentName = s.getGuardianName() != null ? s.getGuardianName() : (rec != null ? rec.getParentName() : null);
        String parentRel = s.getParentRelationship() != null ? s.getParentRelationship() : (rec != null ? rec.getParentRelationship() : null);
        String parentPhone = s.getGuardianPhone() != null ? s.getGuardianPhone() : (rec != null ? rec.getParentPhone() : null);

        String academicYear = s.getAcademicYear() != null ? s.getAcademicYear() : (rec != null ? rec.getAcademicYear() : null);
        Integer grade = s.getGrade() != null ? s.getGrade() : (rec != null ? rec.getGrade() : null);
        String stream = s.getCurrentStream() != null ? s.getCurrentStream() : (rec != null ? rec.getStream() : null);
        String enrollmentType = s.getEnrollmentType() != null ? s.getEnrollmentType() : (rec != null && rec.getEnrollmentType() != null ? rec.getEnrollmentType().name() : null);

        String prevSchool = s.getPreviousSchool() != null ? s.getPreviousSchool() : (rec != null ? rec.getPreviousSchool() : null);
        Double grade8Score = s.getGrade8Score() != null ? s.getGrade8Score() : (rec != null ? rec.getGrade8Score() : null);

        String paymentMethod = s.getPaymentMethod() != null ? s.getPaymentMethod() : (rec != null ? rec.getPaymentMethod() : null);
        String bankRef = s.getBankTransactionRef() != null ? s.getBankTransactionRef() : (rec != null ? rec.getBankTransactionRef() : null);

        String photo = s.getPhotoUrl() != null ? s.getPhotoUrl() : (rec != null ? rec.getPhotoUrl() : null);
        String idDoc = s.getIdDocUrl() != null ? s.getIdDocUrl() : (rec != null ? rec.getIdDocUrl() : null);
        String g8Cert = s.getGrade8CertificateUrl() != null ? s.getGrade8CertificateUrl() : (rec != null ? rec.getGrade8CertificateUrl() : null);
        String relLetter = s.getReleaseLetterUrl() != null ? s.getReleaseLetterUrl() : (rec != null ? rec.getReleaseLetterUrl() : null);
        String payReceipt = s.getPaymentReceiptUrl() != null ? s.getPaymentReceiptUrl() : (rec != null ? rec.getPaymentReceiptUrl() : null);

        return new StudentResponse(
                s.getId(),
                s.getStudentUid(),
                s.getUser() != null ? s.getUser().getId() : null,
                s.getUser() != null ? s.getUser().getUsername() : null,
                s.getUser() != null ? s.getUser().getFullName() : null,
                fn,
                fatN,
                gfN,
                s.getUser() != null ? s.getUser().getEmail() : null,
                s.getUser() != null ? s.getUser().getPhone() : null,
                s.getDateOfBirth(),
                s.getGender(),
                region,
                city,
                kebele,
                houseNo,
                parentName,
                parentRel,
                parentPhone,
                s.getEnrollmentYear(),
                academicYear,
                grade,
                s.getSectionId(),
                sectionLabel,
                stream,
                enrollmentType,
                prevSchool,
                grade8Score,
                paymentMethod,
                bankRef,
                photo,
                idDoc,
                g8Cert,
                relLetter,
                payReceipt,
                genUsername,
                genPassword
        );
    }
}

