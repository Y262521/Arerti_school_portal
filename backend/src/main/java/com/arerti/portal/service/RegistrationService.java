package com.arerti.portal.service;

import com.arerti.portal.dto.*;
import com.arerti.portal.entity.*;
import com.arerti.portal.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.Year;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RegistrationService {

    private final RegistrationWindowRepository windowRepository;
    private final RegistrationAssignmentRepository assignmentRepository;
    private final EnrollmentRecordRepository enrollmentRepository;
    private final TeacherRepository teacherRepository;
    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final GradeSectionRepository sectionRepository;
    private final PasswordEncoder passwordEncoder;
    private final PassingCriteriaService passingCriteria;
    private final AuditService auditService;

    // ── Window management (Director) ─────────────────────────────────────────

    public List<RegistrationWindowResponse> findAllWindows() {
        return windowRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(w -> RegistrationWindowResponse.from(w, getAssignments(w)))
                .collect(Collectors.toList());
    }

    public RegistrationWindowResponse findWindowById(Long id) {
        RegistrationWindow w = getWindow(id);
        return RegistrationWindowResponse.from(w, getAssignments(w));
    }

    @Transactional
    public RegistrationWindowResponse openWindow(RegistrationWindowRequest req) {
        RegistrationWindow w = RegistrationWindow.builder()
                .academicYear(req.academicYear())
                .startDate(req.startDate())
                .endDate(req.endDate())
                .status(RegistrationWindow.WindowStatus.OPEN)
                .note(req.note())
                .openedBy(actorUsername())
                .build();
        return RegistrationWindowResponse.from(windowRepository.save(w), List.of());
    }

    @Transactional
    public RegistrationWindowResponse closeWindow(Long id) {
        RegistrationWindow w = getWindow(id);
        w.setStatus(RegistrationWindow.WindowStatus.CLOSED);
        return RegistrationWindowResponse.from(windowRepository.save(w), getAssignments(w));
    }

    @Transactional
    public RegistrationAssignmentResponse assignTeacher(Long windowId, RegistrationAssignmentRequest req) {
        RegistrationWindow w = getWindow(windowId);
        Teacher teacher = teacherRepository.findById(req.teacherId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Teacher not found"));

        if (assignmentRepository.existsByWindowAndTeacher(w, teacher)) {
            // Update existing assignment
            RegistrationAssignment existing = assignmentRepository.findByWindowAndTeacher(w, teacher).get();
            existing.setAllowedGrades(req.allowedGrades());
            return RegistrationAssignmentResponse.from(assignmentRepository.save(existing));
        }

        RegistrationAssignment a = RegistrationAssignment.builder()
                .window(w)
                .teacher(teacher)
                .allowedGrades(req.allowedGrades())
                .build();
        return RegistrationAssignmentResponse.from(assignmentRepository.save(a));
    }

    public void removeAssignment(Long assignmentId) {
        assignmentRepository.deleteById(assignmentId);
    }

    // ── Teacher: check their active assignment ────────────────────────────────

    public RegistrationWindowResponse getMyActiveWindow(String teacherUsername) {
        Teacher teacher = teacherRepository.findByUser_Username(teacherUsername).orElse(null);
        if (teacher == null) return null;

        // Find active window
        RegistrationWindow activeWindow = windowRepository.findActive(LocalDate.now()).orElse(null);
        if (activeWindow == null) return null;

        // Check teacher is assigned to this window
        RegistrationAssignment assignment = assignmentRepository
                .findByWindowAndTeacher(activeWindow, teacher).orElse(null);
        if (assignment == null) return null;

        return RegistrationWindowResponse.from(activeWindow, List.of(
                RegistrationAssignmentResponse.from(assignment)
        ));
    }

    // ── Student pass status for re-enrollment ────────────────────────────────

    public List<StudentPassStatusResponse> getPassStatusForGrade(
            Integer grade, String previousAcademicYear, String newAcademicYear) {

        // Get all students currently in this grade (from their section)
        List<Student> students = studentRepository.findAll().stream()
                .filter(s -> s.getSectionId() != null)
                .filter(s -> {
                    GradeSection sec = sectionRepository.findById(s.getSectionId()).orElse(null);
                    return sec != null && sec.getGrade().equals(grade)
                           && sec.getAcademicYear().equals(previousAcademicYear);
                })
                .collect(Collectors.toList());

        return students.stream().map(student -> {
            PassingCriteriaService.PassResult result =
                    passingCriteria.evaluate(student, previousAcademicYear);

            GradeSection sec = sectionRepository.findById(student.getSectionId()).orElse(null);
            String sectionLabel = sec != null ? "Grade " + sec.getGrade() + " - " + sec.getSection() : null;

            boolean alreadyEnrolled = enrollmentRepository
                    .existsByStudentAndAcademicYear(student, newAcademicYear);

            return new StudentPassStatusResponse(
                    student.getId(),
                    student.getStudentUid(),
                    student.getUser().getFullName(),
                    sectionLabel,
                    grade,
                    result.passed(),
                    result.average(),
                    result.failedSubjects(),
                    result.totalSubjects(),
                    result.reason(),
                    alreadyEnrolled
            );
        }).collect(Collectors.toList());
    }

    // ── Grade 9: New student enrollment ──────────────────────────────────────

    @Transactional
    public StudentResponse enrollNewStudent(NewStudentEnrollRequest req,
                                             String teacherUsername, Long windowId) {
        Teacher teacher = teacherRepository.findByUser_Username(teacherUsername).orElse(null);
        RegistrationWindow window = getWindow(windowId);

        // Validate window is still active
        if (!window.isActive()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Registration window is closed");
        }

        // Validate teacher is assigned and can register Grade 9
        validateTeacherGradeAccess(window, teacher, 9);

        // Validate section is Grade 9
        GradeSection section = sectionRepository.findById(req.sectionId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Section not found"));
        if (!section.getGrade().equals(9)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "New student enrollment only allowed for Grade 9 sections");
        }

        if (userRepository.existsByEmail(req.email()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use");

        // Auto-generate credentials
        String uid = generateUid();
        String username = uid.toLowerCase().replace("-", "");
        String plainPassword = generatePassword();

        User user = User.builder()
                .username(username).email(req.email())
                .password(passwordEncoder.encode(plainPassword))
                .fullName(req.fullName()).phone(req.phone())
                .role(Role.STUDENT).enabled(true).mustChangePassword(true)
                .build();
        userRepository.save(user);

        Student student = Student.builder()
                .studentUid(uid).user(user)
                .dateOfBirth(req.dateOfBirth()).gender(req.gender())
                .guardianName(req.parentName()).guardianPhone(req.parentPhone())
                .enrollmentYear(Year.now().getValue())
                .sectionId(req.sectionId())
                .build();
        studentRepository.save(student);

        // Save enrollment record
        EnrollmentRecord record = EnrollmentRecord.builder()
                .student(student).academicYear(section.getAcademicYear())
                .grade(9).bankTransactionRef(req.bankTransactionRef())
                .window(window).registeredBy(teacher)
                .enrollmentType(EnrollmentRecord.EnrollmentType.NEW)
                .build();
        enrollmentRepository.save(record);

        auditService.log(teacherUsername, "TEACHER", "ENROLL_NEW", "STUDENT", uid,
                "New Grade 9 student enrolled: " + req.fullName());

        return StudentResponse.fromWithCredentials(student,
                "Grade 9 - " + section.getSection(), username, plainPassword);
    }

    // ── Grade 10-12: Re-enrollment ────────────────────────────────────────────

    @Transactional
    public StudentResponse reEnrollStudent(ReEnrollRequest req,
                                            String teacherUsername, Long windowId,
                                            String previousAcademicYear) {
        Teacher teacher = teacherRepository.findByUser_Username(teacherUsername).orElse(null);
        RegistrationWindow window = getWindow(windowId);

        if (!window.isActive()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Registration window is closed");
        }

        Student student = studentRepository.findById(req.studentId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));

        GradeSection newSection = sectionRepository.findById(req.newSectionId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Section not found"));

        int newGrade = newSection.getGrade();

        // Validate teacher access for this grade
        validateTeacherGradeAccess(window, teacher, newGrade);

        // Check student passes criteria for new grade
        PassingCriteriaService.PassResult result =
                passingCriteria.evaluate(student, previousAcademicYear);
        if (!result.passed()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Student has not passed: " + result.reason());
        }

        // Check not already enrolled
        if (enrollmentRepository.existsByStudentAndAcademicYear(student, window.getAcademicYear())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Student is already enrolled for " + window.getAcademicYear());
        }

        // Move student to new section
        student.setSectionId(req.newSectionId());
        studentRepository.save(student);

        // Save enrollment record
        EnrollmentRecord record = EnrollmentRecord.builder()
                .student(student).academicYear(window.getAcademicYear())
                .grade(newGrade).bankTransactionRef(req.bankTransactionRef())
                .window(window).registeredBy(teacher)
                .enrollmentType(EnrollmentRecord.EnrollmentType.RE_ENROLLMENT)
                .build();
        enrollmentRepository.save(record);

        auditService.log(teacherUsername, "TEACHER", "RE_ENROLL", "STUDENT", student.getStudentUid(),
                "Re-enrolled to Grade " + newGrade + " section " + newSection.getSection());

        String sectionLabel = "Grade " + newSection.getGrade() + " - " + newSection.getSection();
        return StudentResponse.from(student, sectionLabel);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void validateTeacherGradeAccess(RegistrationWindow window,
                                             Teacher teacher, Integer grade) {
        if (teacher == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only teachers can register students");
        }
        RegistrationAssignment assignment = assignmentRepository
                .findByWindowAndTeacher(window, teacher)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "You are not assigned to this registration window"));

        if (!assignment.getAllowedGradeList().contains(grade)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You are not authorized to register Grade " + grade + " students");
        }
    }

    private List<RegistrationAssignmentResponse> getAssignments(RegistrationWindow w) {
        return assignmentRepository.findByWindow(w).stream()
                .map(RegistrationAssignmentResponse::from)
                .collect(Collectors.toList());
    }

    private RegistrationWindow getWindow(Long id) {
        return windowRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Registration window not found"));
    }

    private String generateUid() {
        int year = Year.now().getValue();
        String suffix = java.util.UUID.randomUUID().toString()
                .replace("-", "").substring(0, 6).toUpperCase();
        return String.format("STU-%d-%s", year, suffix);
    }

    private String generatePassword() {
        int rand = 100 + (int)(Math.random() * 900);
        return "Arerti@" + Year.now().getValue() + rand;
    }

    private String actorUsername() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : "system";
    }
}
