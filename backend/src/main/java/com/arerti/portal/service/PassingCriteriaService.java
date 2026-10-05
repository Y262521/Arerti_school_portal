package com.arerti.portal.service;

import com.arerti.portal.entity.Student;
import com.arerti.portal.repository.GradeEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Determines whether a student has passed to the next grade based on the
 * Ethiopian secondary school passing criteria:
 *
 *   Failed subjects | Minimum average to pass
 *   ─────────────────────────────────────────
 *        0          |  ≥ 50
 *        1          |  ≥ 51
 *        2          |  ≥ 53
 *        3          |  ≥ 55
 *        4+         |  FAILED regardless of average
 */
@Service
@RequiredArgsConstructor
public class PassingCriteriaService {

    private final GradeEntryRepository gradeEntryRepository;

    public PassResult evaluate(Student student, String academicYear) {
        // Get all grade entries for the student for this academic year
        var entries = gradeEntryRepository.findByStudentAndAcademicYear(student, academicYear);

        if (entries.isEmpty()) {
            return new PassResult(false, 0, 0, 0, "No grades recorded for this year");
        }

        // Count failed subjects (score < 50)
        long failedCount = entries.stream().filter(e -> e.getScore() < 50).count();
        double average = entries.stream().mapToDouble(e -> e.getScore()).average().orElse(0);
        int subjectCount = entries.size();

        boolean passed;
        String reason;

        if (failedCount >= 4) {
            passed = false;
            reason = failedCount + " subjects failed — automatic failure (4+ failed subjects)";
        } else if (failedCount == 0) {
            passed = average >= 50;
            reason = passed
                    ? "All subjects passed, average " + String.format("%.1f", average)
                    : "Average " + String.format("%.1f", average) + " is below 50";
        } else if (failedCount == 1) {
            passed = average >= 51;
            reason = passed
                    ? "1 failed subject, average " + String.format("%.1f", average) + " ≥ 51"
                    : "1 failed subject, average " + String.format("%.1f", average) + " < 51 required";
        } else if (failedCount == 2) {
            passed = average >= 53;
            reason = passed
                    ? "2 failed subjects, average " + String.format("%.1f", average) + " ≥ 53"
                    : "2 failed subjects, average " + String.format("%.1f", average) + " < 53 required";
        } else { // failedCount == 3
            passed = average >= 55;
            reason = passed
                    ? "3 failed subjects, average " + String.format("%.1f", average) + " ≥ 55"
                    : "3 failed subjects, average " + String.format("%.1f", average) + " < 55 required";
        }

        return new PassResult(passed, average, (int) failedCount, subjectCount, reason);
    }

    public record PassResult(
            boolean passed,
            double average,
            int failedSubjects,
            int totalSubjects,
            String reason
    ) {}
}
