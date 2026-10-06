package com.arerti.portal.service;

import com.arerti.portal.entity.Student;
import com.arerti.portal.repository.GradeEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Determines whether a student has passed to the next grade.
 *
 * TWO-SEMESTER LOGIC:
 *   1. Each semester is evaluated independently using the criteria below.
 *   2. Final pass = average of (Semester 1 average + Semester 2 average) / 2 ≥ 50
 *   3. If only one semester has grades, that semester's result is used as-is.
 *
 * Per-semester criteria (applied to each semester independently):
 *   Failed subjects | Min average required
 *   ─────────────────────────────────────
 *        0          |  ≥ 50
 *        1          |  ≥ 51
 *        2          |  ≥ 53
 *        3          |  ≥ 55
 *        4+         |  FAILED (automatic, regardless of average)
 */
@Service
@RequiredArgsConstructor
public class PassingCriteriaService {

    private final GradeEntryRepository gradeEntryRepository;

    /**
     * Evaluates pass/fail for a student across both semesters of an academic year.
     */
    public PassResult evaluate(Student student, String academicYear) {
        var sem1Entries = gradeEntryRepository.findByStudentAndTermAndAcademicYear(
                student, 1, academicYear);
        var sem2Entries = gradeEntryRepository.findByStudentAndTermAndAcademicYear(
                student, 2, academicYear);

        if (sem1Entries.isEmpty() && sem2Entries.isEmpty()) {
            return new PassResult(false, 0, 0, 0, 0, 0, 0, false,
                    "No grades recorded for " + academicYear);
        }

        SemesterResult r1 = sem1Entries.isEmpty() ? null : evaluateSemester(sem1Entries, 1);
        SemesterResult r2 = sem2Entries.isEmpty() ? null : evaluateSemester(sem2Entries, 2);

        // Compute annual average
        double annualAverage;
        boolean sem1Failed4Plus = (r1 != null && r1.failedSubjects() >= 4);
        boolean sem2Failed4Plus = (r2 != null && r2.failedSubjects() >= 4);

        if (sem1Failed4Plus || sem2Failed4Plus) {
            // Automatic failure if 4+ subjects failed in any semester
            int failedIn = sem1Failed4Plus ? 1 : 2;
            return new PassResult(false,
                    r1 != null ? r1.average() : 0,
                    r2 != null ? r2.average() : 0,
                    0,
                    r1 != null ? r1.failedSubjects() : 0,
                    r2 != null ? r2.failedSubjects() : 0,
                    r1 != null ? r1.totalSubjects() : (r2 != null ? r2.totalSubjects() : 0),
                    false,
                    "Semester " + failedIn + " has 4+ failed subjects — automatic failure");
        }

        if (r1 != null && r2 != null) {
            annualAverage = (r1.average() + r2.average()) / 2.0;
        } else if (r1 != null) {
            annualAverage = r1.average();
        } else {
            annualAverage = r2.average();
        }

        // Use the higher failed count across both semesters for the threshold
        int maxFailed = Math.max(
                r1 != null ? r1.failedSubjects() : 0,
                r2 != null ? r2.failedSubjects() : 0);

        double threshold = switch (maxFailed) {
            case 0 -> 50.0;
            case 1 -> 51.0;
            case 2 -> 53.0;
            case 3 -> 55.0;
            default -> Double.MAX_VALUE; // 4+ handled above
        };

        boolean passed = annualAverage >= threshold;
        String reason = passed
                ? String.format("Annual average %.1f ≥ %.0f (max failed in one semester: %d)",
                        annualAverage, threshold, maxFailed)
                : String.format("Annual average %.1f < %.0f required (max failed in one semester: %d)",
                        annualAverage, threshold, maxFailed);

        return new PassResult(
                passed,
                r1 != null ? r1.average() : 0,
                r2 != null ? r2.average() : 0,
                annualAverage,
                r1 != null ? r1.failedSubjects() : 0,
                r2 != null ? r2.failedSubjects() : 0,
                r1 != null ? r1.totalSubjects() : (r2 != null ? r2.totalSubjects() : 0),
                passed,
                reason
        );
    }

    /** Evaluate a single semester */
    private SemesterResult evaluateSemester(
            List<com.arerti.portal.entity.GradeEntry> entries, int semesterNum) {
        long failed = entries.stream().filter(e -> e.getScore() < 50).count();
        double avg = entries.stream().mapToDouble(e -> e.getScore()).average().orElse(0);
        return new SemesterResult(semesterNum, avg, (int) failed, entries.size());
    }

    // ── Result records ────────────────────────────────────────────────────────

    public record PassResult(
            boolean passed,
            double semester1Average,
            double semester2Average,
            double annualAverage,
            int failedSubjectsSem1,
            int failedSubjectsSem2,
            int totalSubjects,
            boolean finalPassed,
            String reason
    ) {
        // Backward-compat helpers used by RegistrationService
        public double average()      { return annualAverage > 0 ? annualAverage : Math.max(semester1Average, semester2Average); }
        public int failedSubjects()  { return Math.max(failedSubjectsSem1, failedSubjectsSem2); }
    }

    private record SemesterResult(int semester, double average, int failedSubjects, int totalSubjects) {}
}
