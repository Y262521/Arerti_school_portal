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
            RegistrationAssignment existing = assignmentRepository.findByWindowAndTeacher(w, teacher).get();
            existing.setAllowedGrades(req.allowedGrades());
            return RegistrationAssignmentResponse.from(assignmentRepository.save(existing));
        }

        RegistrationAssignment a = RegistrationAssignment.builder()
                .window(w).teacher(teacher).allowedGrades(req.allowedGrades())
                .build();
        return RegistrationAssignmentResponse.from(assignmentRepository.save(a));
    }

    public void removeAssignment(Long assignmentId) {
        assignmentRepository.deleteById(assignmentId);
    }

    // ── Teacher: active window ────────────────────────────────────────────────

    public RegistrationWindowResponse getMyActiveWindow(String teacherUsername) {
        Teacher teacher = teacherRepository.findByUser_Username(teacherUsername).orElse(null);
        if (teacher == null) return null;

        // First try: window active today (within date range)
        RegistrationWindow activeWindow = windowRepository.findActive(LocalDate.now())
                // Fallback: any OPEN window (director may have set future start date during setup/testing)
                .or(() -> windowRepository.findFirstByStatusOrderByCreatedAtDesc(
                        RegistrationWindow.WindowStatus.OPEN))
                .orElse(null);
        if (activeWindow == null) return null;

        RegistrationAssignment assignment = assignmentRepository
                .findByWindowAndTeacher(activeWindow, teacher).orElse(null);
        if (assignment == null) return null;

        return RegistrationWindowResponse.from(activeWindow, List.of(
                RegistrationAssignmentResponse.from(assignment)
        ));
    }

    // ── Pass status for re-enrollment list ───────────────────────────────────

    public List<StudentPassStatusResponse> getPassStatusForGrade(
            Integer grade, String previousAcademicYear, String newAcademicYear) {
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
                    student.getId(), student.getStudentUid(),
                    student.getUser().getFullName(), sectionLabel, grade,
                    result.passed(), result.average(),
                    result.failedSubjects(), result.totalSubjects(),
                    result.reason(), alreadyEnrolled
            );
        }).collect(Collectors.toList());
    }

    // ── NEW / TRANSFER: Full enrollment form ──────────────────────────────────

    @Transactional
    public StudentResponse enrollFullForm(FullEnrollRequest req,
                                           String teacherUsername, Long windowId) {
        Teacher teacher = teacherRepository.findByUser_Username(teacherUsername).orElse(null);
        RegistrationWindow window = getWindow(windowId);

        if (!window.isActive())
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Registration window is closed");

        GradeSection section = sectionRepository.findById(req.sectionId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Section not found"));

        validateTeacherGradeAccess(window, teacher, section.getGrade());
        validateCapacity(section);

        // TRANSFER can go to any grade; NEW must be Grade 9
        EnrollmentRecord.EnrollmentType type = EnrollmentRecord.EnrollmentType.valueOf(req.enrollmentType());
        if (type == EnrollmentRecord.EnrollmentType.NEW && section.getGrade() != 9)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New students can only enroll in Grade 9");

        if (userRepository.existsByEmail(req.email()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use");

        String uid = generateUid();
        String username = uid.toLowerCase().replace("-", "");
        String plainPassword = generatePassword();

        User user = User.builder()
                .username(username).email(req.email())
                .password(passwordEncoder.encode(plainPassword))
                .fullName(req.firstName() + " " + req.fatherName())
                .role(Role.STUDENT).enabled(true).mustChangePassword(true)
                .build();
        userRepository.save(user);

        Student student = Student.builder()
                .studentUid(uid).user(user)
                .dateOfBirth(req.dateOfBirth()).gender(req.gender())
                .guardianName(req.parentName()).guardianPhone(req.parentPhone())
                .enrollmentYear(Year.now().getValue())
                .sectionId(req.sectionId())
                .currentStream(req.stream())
                .photoUrl(req.photoUrl())
                .build();
        studentRepository.save(student);

        EnrollmentRecord record = EnrollmentRecord.builder()
                .student(student).academicYear(section.getAcademicYear())
                .grade(section.getGrade()).enrollmentType(type)
                .stream(req.stream())
                .firstName(req.firstName()).fatherName(req.fatherName())
                .grandfatherName(req.grandfatherName()).gender(req.gender())
                .dateOfBirth(req.dateOfBirth()).region(req.region())
                .city(req.city()).kebele(req.kebele()).houseNo(req.houseNo())
                .photoUrl(req.photoUrl()).idDocUrl(req.idDocUrl())
                .grade8CertificateUrl(req.grade8CertificateUrl())
                .releaseLetterUrl(req.releaseLetterUrl())
                .grade8Score(req.grade8Score()).previousSchool(req.previousSchool())
                .parentName(req.parentName()).parentRelationship(req.parentRelationship())
                .parentPhone(req.parentPhone())
                .paymentMethod(req.paymentMethod())
                .bankTransactionRef(req.bankTransactionRef())
                .paymentReceiptUrl(req.paymentReceiptUrl())
                .window(window).registeredBy(teacher)
                .build();
        enrollmentRepository.save(record);

        auditService.log(teacherUsername, "TEACHER", "ENROLL_" + type.name(), "STUDENT", uid,
                type.name() + " student enrolled: " + req.firstName() + " " + req.fatherName());

        String sectionLabel = "Grade " + section.getGrade() + " - " + section.getSection();
        return StudentResponse.fromWithCredentials(student, sectionLabel, username, plainPassword);
    }

    // ── PROMOTED / REPEATER: Quick re-enrollment ──────────────────────────────

    @Transactional
    public EnrollmentRecordResponse enrollExisting(ExistingStudentEnrollRequest req,
                                                    String teacherUsername, Long windowId,
                                                    String previousAcademicYear) {
        Teacher teacher = teacherRepository.findByUser_Username(teacherUsername).orElse(null);
        RegistrationWindow window = getWindow(windowId);

        if (!window.isActive())
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Registration window is closed");

        Student student = studentRepository.findById(req.studentId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));

        GradeSection newSection = sectionRepository.findById(req.newSectionId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Section not found"));

        validateTeacherGradeAccess(window, teacher, newSection.getGrade());
        validateCapacity(newSection);

        EnrollmentRecord.EnrollmentType type = EnrollmentRecord.EnrollmentType.valueOf(req.enrollmentType());

        // For PROMOTED: verify they passed
        if (type == EnrollmentRecord.EnrollmentType.PROMOTED) {
            PassingCriteriaService.PassResult result =
                    passingCriteria.evaluate(student, previousAcademicYear);
            if (!result.passed())
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Student has not passed: " + result.reason());
        }

        if (enrollmentRepository.existsByStudentAndAcademicYear(student, window.getAcademicYear()))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Student already enrolled for " + window.getAcademicYear());

        // Update student section + stream
        student.setSectionId(req.newSectionId());
        if (req.stream() != null) student.setCurrentStream(req.stream());
        studentRepository.save(student);

        EnrollmentRecord record = EnrollmentRecord.builder()
                .student(student).academicYear(window.getAcademicYear())
                .grade(newSection.getGrade()).enrollmentType(type)
                .stream(req.stream())
                .paymentMethod(req.paymentMethod())
                .bankTransactionRef(req.bankTransactionRef())
                .paymentReceiptUrl(req.paymentReceiptUrl())
                .window(window).registeredBy(teacher)
                .build();
        enrollmentRepository.save(record);

        auditService.log(teacherUsername, "TEACHER", "RE_ENROLL_" + type.name(), "STUDENT",
                student.getStudentUid(), type.name() + " → Grade " + newSection.getGrade());

        return EnrollmentRecordResponse.from(record);
    }

    // ── Enrollment audit for director ─────────────────────────────────────────

    public List<EnrollmentRecordResponse> getEnrollmentsForWindow(Long windowId) {
        RegistrationWindow window = getWindow(windowId);
        return enrollmentRepository.findByWindowOrderByCreatedAtDesc(window)
                .stream().map(EnrollmentRecordResponse::from).collect(Collectors.toList());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void validateTeacherGradeAccess(RegistrationWindow window, Teacher teacher, Integer grade) {
        if (teacher == null)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only teachers can register students");
        RegistrationAssignment assignment = assignmentRepository
                .findByWindowAndTeacher(window, teacher)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "You are not assigned to this registration window"));
        if (!assignment.getAllowedGradeList().contains(grade))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You are not authorized to register Grade " + grade + " students");
    }

    private void validateCapacity(GradeSection section) {
        if (section.getMaxCapacity() == null) return;
        long current = studentRepository.findAll().stream()
                .filter(s -> section.getId().equals(s.getSectionId())).count();
        if (current >= section.getMaxCapacity())
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Grade " + section.getGrade() + " Section " + section.getSection()
                    + " is full (" + section.getMaxCapacity() + "/" + section.getMaxCapacity() + ")");
    }

    private List<RegistrationAssignmentResponse> getAssignments(RegistrationWindow w) {
        return assignmentRepository.findByWindow(w).stream()
                .map(RegistrationAssignmentResponse::from).collect(Collectors.toList());
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
