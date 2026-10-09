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
    private final com.arerti.portal.repository.GradeEntryRepository gradeEntryRepository;

    // ── Auto-close expired windows ───────────────────────────────────────────

    @Transactional
    public void autoCloseExpiredWindows() {
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        List<RegistrationWindow> openWindows = windowRepository.findAllByStatus(RegistrationWindow.WindowStatus.OPEN);
        for (RegistrationWindow w : openWindows) {
            if (now.isAfter(w.getEndDatetime())) {
                w.setStatus(RegistrationWindow.WindowStatus.CLOSED);
                windowRepository.save(w);
            }
        }
    }

    // ── Window management (Director) ─────────────────────────────────────────

    @Transactional
    public List<RegistrationWindowResponse> findAllWindows() {
        autoCloseExpiredWindows();
        return windowRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(w -> RegistrationWindowResponse.from(w, getAssignments(w)))
                .collect(Collectors.toList());
    }

    @Transactional
    public RegistrationWindowResponse findWindowById(Long id) {
        autoCloseExpiredWindows();
        RegistrationWindow w = getWindow(id);
        return RegistrationWindowResponse.from(w, getAssignments(w));
    }

    @Transactional
    public RegistrationWindowResponse openWindow(RegistrationWindowRequest req) {
        RegistrationWindow w = RegistrationWindow.builder()
                .academicYear(req.academicYear())
                .startDatetime(req.startDatetime())
                .endDatetime(req.endDatetime())
                .status(RegistrationWindow.WindowStatus.OPEN)
                .note(req.note())
                .openedBy(actorUsername())
                .postponeCount(0)
                .build();
        return RegistrationWindowResponse.from(windowRepository.save(w), List.of());
    }

    @Transactional
    public RegistrationWindowResponse postponeWindow(Long id, PostponeRequest req) {
        RegistrationWindow w = getWindow(id);
        if (w.getStatus() != RegistrationWindow.WindowStatus.OPEN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Window is already closed");
        }
        if (req.newEndDatetime().isBefore(w.getEndDatetime())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "New end datetime must be later than the current end datetime");
        }
        w.setEndDatetime(req.newEndDatetime());
        w.setPostponeCount(w.getPostponeCount() + 1);
        if (req.reason() != null && !req.reason().isBlank()) {
            w.setNote((w.getNote() != null ? w.getNote() + " | " : "") + "Postponed: " + req.reason());
        }
        return RegistrationWindowResponse.from(windowRepository.save(w), getAssignments(w));
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

    @Transactional
    public RegistrationWindowResponse getMyActiveWindow(String teacherUsername) {
        autoCloseExpiredWindows();
        Teacher teacher = teacherRepository.findByUser_Username(teacherUsername).orElse(null);
        if (teacher == null) return null;

        // Window active right now (within datetime range and status OPEN)
        RegistrationWindow activeWindow = windowRepository.findActive(java.time.LocalDateTime.now())
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
                    result.passed(),
                    result.semester1Average(), result.semester2Average(), result.annualAverage(),
                    result.failedSubjectsSem1(), result.failedSubjectsSem2(),
                    result.totalSubjects(), result.reason(), alreadyEnrolled
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

        // Validate section if provided — otherwise student stays unassigned
        GradeSection section = null;
        if (req.sectionId() != null) {
            section = sectionRepository.findById(req.sectionId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Section not found"));
            validateTeacherGradeAccess(window, teacher, section.getGrade());
            validateCapacity(section);
        } else {
            // Validate teacher has access to the target grade
            validateTeacherGradeAccess(window, teacher, req.targetGrade());
        }

        // TRANSFER can go to any grade; NEW must be Grade 9
        EnrollmentRecord.EnrollmentType type = EnrollmentRecord.EnrollmentType.valueOf(req.enrollmentType());
        if (type == EnrollmentRecord.EnrollmentType.NEW && req.targetGrade() != 9)
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

        int grade = section != null ? section.getGrade() : req.targetGrade();
        String academicYear = section != null ? section.getAcademicYear() : req.academicYear();

        Student student = Student.builder()
                .studentUid(uid).user(user)
                .firstName(req.firstName()).fatherName(req.fatherName()).grandfatherName(req.grandfatherName())
                .dateOfBirth(req.dateOfBirth()).gender(req.gender())
                .region(req.region()).city(req.city()).kebele(req.kebele()).houseNo(req.houseNo())
                .guardianName(req.parentName()).guardianPhone(req.parentPhone())
                .parentRelationship(req.parentRelationship())
                .enrollmentYear(Year.now().getValue())
                .academicYear(academicYear)
                .grade(grade)
                .enrollmentType(type.name())
                .sectionId(req.sectionId())  // null if not assigned yet
                .currentStream(req.stream())
                .previousSchool(req.previousSchool())
                .grade8Score(req.grade8Score())
                .paymentMethod(req.paymentMethod())
                .bankTransactionRef(req.bankTransactionRef())
                .photoUrl(req.photoUrl())
                .idDocUrl(req.idDocUrl())
                .grade8CertificateUrl(req.grade8CertificateUrl())
                .releaseLetterUrl(req.releaseLetterUrl())
                .paymentReceiptUrl(req.paymentReceiptUrl())
                .build();
        studentRepository.save(student);

        EnrollmentRecord record = EnrollmentRecord.builder()
                .student(student).academicYear(academicYear)
                .grade(grade).enrollmentType(type)
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

        String sectionLabel = section != null
                ? "Grade " + section.getGrade() + " - " + section.getSection()
                : "Grade " + req.targetGrade() + " (section pending assignment)";
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

        // Section is optional — null means auto-assigned later by director
        GradeSection newSection = null;
        int newGrade;
        if (req.newSectionId() != null) {
            newSection = sectionRepository.findById(req.newSectionId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Section not found"));
            newGrade = newSection.getGrade();
            validateCapacity(newSection);
        } else {
            // Determine grade from current section + 1 (for PROMOTED) or same (for REPEATER)
            GradeSection currentSection = student.getSectionId() != null
                    ? sectionRepository.findById(student.getSectionId()).orElse(null) : null;
            int currentGrade = currentSection != null ? currentSection.getGrade() : 9;
            newGrade = req.enrollmentType().equals("PROMOTED") ? currentGrade + 1 : currentGrade;
        }

        validateTeacherGradeAccess(window, teacher, newGrade);

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

        // Update student section + stream (only if section assigned)
        if (req.newSectionId() != null) student.setSectionId(req.newSectionId());
        if (req.stream() != null) student.setCurrentStream(req.stream());
        studentRepository.save(student);

        EnrollmentRecord record = EnrollmentRecord.builder()
                .student(student).academicYear(window.getAcademicYear())
                .grade(newGrade).enrollmentType(type)
                .stream(req.stream())
                .paymentMethod(req.paymentMethod())
                .bankTransactionRef(req.bankTransactionRef())
                .paymentReceiptUrl(req.paymentReceiptUrl())
                .window(window).registeredBy(teacher)
                .build();
        enrollmentRepository.save(record);

        auditService.log(teacherUsername, "TEACHER", "RE_ENROLL_" + type.name(), "STUDENT",
                student.getStudentUid(), type.name() + " → Grade " + newGrade);

        return EnrollmentRecordResponse.from(record);
    }

    // ── Enrollment audit for director ─────────────────────────────────────────

    public List<EnrollmentRecordResponse> getEnrollmentsForWindow(Long windowId) {
        RegistrationWindow window = getWindow(windowId);
        return enrollmentRepository.findByWindowOrderByCreatedAtDesc(window)
                .stream().map(EnrollmentRecordResponse::from).collect(Collectors.toList());
    }

    // ── Auto-assign students to sections by performance ───────────────────────

    /**
     * Distributes unassigned students for a given grade across available sections.
     * Sorting rule:
     *   Grade 9  → by Grade 8 exam score (stored in EnrollmentRecord.grade8Score)
     *   Grade 10 → by Grade 9 average (from GradeEntry)
     *   Grade 11 → by Grade 10 average
     *   Grade 12 → by Grade 11 average
     *
     * Distribution: round-robin so each section gets a mix of top/mid/low performers.
     * e.g. 3 sections A,B,C with 9 students ranked 1-9:
     *   Rank 1 → A, Rank 2 → B, Rank 3 → C, Rank 4 → A, Rank 5 → B... etc.
     */
    @Transactional
    public AutoAssignResponse autoAssign(AutoAssignRequest req) {
        // Get all sections for this grade and academic year
        List<GradeSection> sections = sectionRepository.findAll().stream()
                .filter(s -> s.getGrade().equals(req.grade())
                        && s.getAcademicYear().equals(req.academicYear()))
                .sorted(java.util.Comparator.comparing(GradeSection::getSection))
                .collect(Collectors.toList());

        if (sections.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "No sections found for Grade " + req.grade() + " in " + req.academicYear()
                    + ". Please create sections first.");
        }

        // Get all students enrolled for this grade+year with no section assigned
        List<Student> unassigned = enrollmentRepository.findByAcademicYearAndGradeOrderByCreatedAtDesc(
                        req.academicYear(), req.grade())
                .stream()
                .map(EnrollmentRecord::getStudent)
                .filter(s -> s.getSectionId() == null)
                .distinct()
                .collect(Collectors.toList());

        if (unassigned.isEmpty()) {
            return new AutoAssignResponse(0, 0, 0,
                    java.util.Collections.emptyMap(),
                    "No unassigned students found for Grade " + req.grade());
        }

        // Score each student based on their previous grade's performance
        int previousGrade = req.grade() - 1;
        String previousYear = getPreviousAcademicYear(req.academicYear());

        List<StudentWithScore> scored = unassigned.stream().map(student -> {
            double score = 0;
            if (req.grade() == 9) {
                // Use Grade 8 exam score from enrollment record
                score = enrollmentRepository
                        .findByStudentAndAcademicYear(student, req.academicYear())
                        .map(r -> r.getGrade8Score() != null ? r.getGrade8Score() : 0.0)
                        .orElse(0.0);
            } else {
                // Use average from previous grade's entries
                var entries = gradeEntryRepository.findByStudentAndAcademicYear(student, previousYear);
                score = entries.isEmpty() ? 0.0
                        : entries.stream().mapToDouble(e -> e.getScore()).average().orElse(0.0);
            }
            return new StudentWithScore(student, score);
        }).sorted(java.util.Comparator.comparingDouble(StudentWithScore::score).reversed())
          .collect(Collectors.toList());

        // Round-robin assignment
        java.util.Map<String, Integer> sectionCounts = new java.util.LinkedHashMap<>();
        sections.forEach(s -> sectionCounts.put(
                "Grade " + s.getGrade() + " - " + s.getSection(), 0));

        int sectionIndex = 0;
        int assigned = 0;
        for (StudentWithScore sw : scored) {
            GradeSection section = sections.get(sectionIndex % sections.size());
            sw.student().setSectionId(section.getId());
            studentRepository.save(sw.student());
            String key = "Grade " + section.getGrade() + " - " + section.getSection();
            sectionCounts.merge(key, 1, Integer::sum);
            sectionIndex++;
            assigned++;
        }

        auditService.log(actorUsername(), "ADMIN", "AUTO_ASSIGN", "REGISTRATION",
                req.academicYear() + "-G" + req.grade(),
                "Auto-assigned " + assigned + " students to " + sections.size() + " sections");

        return new AutoAssignResponse(
                scored.size(), assigned, 0, sectionCounts,
                "✅ " + assigned + " students assigned to " + sections.size() + " sections for Grade " + req.grade()
        );
    }

    private String getPreviousAcademicYear(String academicYear) {
        String[] parts = academicYear.split("/");
        if (parts.length < 2) return academicYear;
        int start = Integer.parseInt(parts[0]) - 1;
        int end = Integer.parseInt(parts[1]) - 1;
        return start + "/" + end;
    }

    private record StudentWithScore(Student student, double score) {}

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
        RegistrationWindow w = windowRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Registration window not found"));
        if (w.getStatus() == RegistrationWindow.WindowStatus.OPEN && java.time.LocalDateTime.now().isAfter(w.getEndDatetime())) {
            w.setStatus(RegistrationWindow.WindowStatus.CLOSED);
            w = windowRepository.save(w);
        }
        return w;
    }

    private synchronized String generateUid() {
        List<String> uids = studentRepository.findAgspsUids();
        int maxNum = 999;
        for (String uid : uids) {
            if (uid != null && uid.toUpperCase().startsWith("AGSPS-")) {
                try {
                    int val = Integer.parseInt(uid.substring(6).trim());
                    if (val > maxNum) {
                        maxNum = val;
                    }
                } catch (NumberFormatException ignored) {}
            }
        }
        int next = maxNum + 1;
        String candidate = "AGSPS-" + next;
        while (studentRepository.existsByStudentUid(candidate)) {
            next++;
            candidate = "AGSPS-" + next;
        }
        return candidate;
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
