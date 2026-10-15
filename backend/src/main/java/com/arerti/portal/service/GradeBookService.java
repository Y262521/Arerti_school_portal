package com.arerti.portal.service;

import com.arerti.portal.dto.GradeEntryRequest;
import com.arerti.portal.dto.GradeEntryResponse;
import com.arerti.portal.entity.*;
import com.arerti.portal.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GradeBookService {

    private final GradeEntryRepository gradeEntryRepository;
    private final StudentRepository studentRepository;
    private final SubjectRepository subjectRepository;
    private final TeacherRepository teacherRepository;
    private final ClassSubjectAssignmentRepository assignmentRepository;
    private final GradeSectionRepository sectionRepository;
    private final AuditService auditService;
    @Lazy
    private final GradeEntryWindowService gradeEntryWindowService;

    // ── Queries ─────────────────────────────────────────────────────────────

    public List<GradeEntryResponse> getForStudent(Long studentId, String academicYear) {
        Student student = getStudent(studentId);
        return gradeEntryRepository.findByStudentAndAcademicYear(student, academicYear)
                .stream().map(GradeEntryResponse::from).collect(Collectors.toList());
    }

    public List<GradeEntryResponse> getForSection(Long sectionId, Integer term, String academicYear) {
        return gradeEntryRepository.findByStudent_SectionIdAndTermAndAcademicYear(sectionId, term, academicYear)
                .stream().map(GradeEntryResponse::from).collect(Collectors.toList());
    }

    // ── Entry / Edit ─────────────────────────────────────────────────────────

    /**
     * Saves or updates a grade entry.
     *
     * Rules:
     * - ADMIN → can always save/edit anything.
     * - Subject teacher → can save NEW entries for their assigned subject.
     *   Once saved (locked=true) they CANNOT edit. 403 returned.
     * - Homeroom teacher → same as subject teacher for their own subject.
     *   For OTHER subjects: can edit ONLY if a RegradePermission is active (checked by caller via isRegradeAllowed flag).
     */
    @Transactional
    public GradeEntryResponse upsert(GradeEntryRequest req,
                                     String actorUsername,
                                     boolean isAdmin,
                                     boolean isRegradeAllowed) {
        Student student = getStudent(req.studentId());
        Subject subject = subjectRepository.findById(req.subjectId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Subject not found"));

        Teacher teacher = teacherRepository.findByUser_Username(actorUsername).orElse(null);

        // Check if this teacher is assigned to this subject in this class
        boolean isAssignedToSubject = false;
        if (teacher != null && student.getSectionId() != null) {
            GradeSection section = sectionRepository.findById(student.getSectionId()).orElse(null);
            if (section != null) {
                isAssignedToSubject = assignmentRepository
                        .findBySectionAndSubjectId(section, req.subjectId())
                        .map(a -> a.getTeacher() != null && a.getTeacher().getId().equals(teacher.getId()))
                        .orElse(false);
            }
        }

        // Find existing entry
        GradeEntry entry = gradeEntryRepository
                .findByStudentIdAndSubjectIdAndTermAndAcademicYear(
                        req.studentId(), req.subjectId(), req.term(), req.academicYear())
                .orElse(null);

        boolean isNewEntry = (entry == null);

        if (!isAdmin) {
            if (teacher == null) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only teachers or admins can enter grades");
            }
            // Check grade entry window is open for this semester+year
            if (!gradeEntryWindowService.isGradeEntryOpen(req.academicYear(), req.term())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Grade entry is closed. The director must open the grade entry window first.");
            }
            if (!isNewEntry && entry.isLocked()) {
                // Entry exists and is locked — only allowed if regrade permission granted
                if (!isRegradeAllowed) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                            "Marks are locked. Request regrade permission from the administrator.");
                }
                // Has regrade permission — allowed to edit even if not assigned to this subject
            } else if (isNewEntry && !isAssignedToSubject) {
                // New entry — teacher must be assigned to this subject
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "You are not assigned to teach this subject in this class.");
            }
        }

        if (isNewEntry) {
            entry = GradeEntry.builder()
                    .student(student)
                    .subject(subject)
                    .term(req.term())
                    .academicYear(req.academicYear())
                    .locked(false)
                    .build();
        }

        // Apply component marks
        entry.setMidExam(req.midExam());
        entry.setFinalExam(req.finalExam());
        entry.setAssignment(req.assignment());
        entry.setTestQuiz(req.testQuiz());
        entry.setComment(req.comment());
        entry.setRecordedBy(teacher);
        entry.recalculateScore();

        // Lock once the final exam is submitted by the subject teacher, or re-lock after an approved regrade edit
        if (!isAdmin) {
            if (isRegradeAllowed || entry.getFinalExam() != null) {
                entry.setLocked(true);
            }
        }

        GradeEntry saved = gradeEntryRepository.save(entry);

        // Audit log — fire-and-forget, never breaks the main operation
        String action = isNewEntry ? "CREATE_GRADE" : "UPDATE_GRADE";
        auditService.log(
                actorUsername(), actorRole(), action, "GRADE",
                student.getStudentUid(),
                "Subject: " + subject.getName()
                        + ", Score: " + saved.getScore()
                        + ", Term: " + req.term()
                        + ", Year: " + req.academicYear()
        );

        return GradeEntryResponse.from(saved);
    }

    @Transactional
    public void delete(Long id, boolean isAdmin) {
        GradeEntry e = gradeEntryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Grade not found"));
        if (!isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only admins can delete grade entries");
        }
        gradeEntryRepository.delete(e);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private Student getStudent(Long id) {
        return studentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));
    }

    private String actorUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : "unknown";
    }

    private String actorRole() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return "unknown";
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith("ROLE_"))
                .map(a -> a.substring(5))
                .findFirst()
                .orElse("unknown");
    }
}
