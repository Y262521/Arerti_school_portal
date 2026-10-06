package com.arerti.portal.dto;

import com.arerti.portal.entity.EnrollmentRecord;
import java.time.Instant;

public record EnrollmentRecordResponse(
        Long id,
        Long studentId,
        String studentName,
        String studentUid,
        String academicYear,
        Integer grade,
        String enrollmentType,
        String stream,
        String paymentMethod,
        String bankTransactionRef,
        String paymentReceiptUrl,
        String photoUrl,
        String registeredBy,
        Instant createdAt
) {
    public static EnrollmentRecordResponse from(EnrollmentRecord r) {
        return new EnrollmentRecordResponse(
                r.getId(),
                r.getStudent().getId(),
                r.getStudent().getUser().getFullName(),
                r.getStudent().getStudentUid(),
                r.getAcademicYear(),
                r.getGrade(),
                r.getEnrollmentType().name(),
                r.getStream(),
                r.getPaymentMethod(),
                r.getBankTransactionRef(),
                r.getPaymentReceiptUrl(),
                r.getStudent().getPhotoUrl(),
                r.getRegisteredBy() != null ? r.getRegisteredBy().getUser().getFullName() : null,
                r.getCreatedAt()
        );
    }
}
