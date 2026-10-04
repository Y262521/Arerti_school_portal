package com.arerti.portal.service;

import com.arerti.portal.dto.StudentCreateRequest;
import com.arerti.portal.dto.StudentUpdateRequest;
import com.arerti.portal.dto.StudentResponse;
import com.arerti.portal.entity.Role;
import com.arerti.portal.entity.Student;
import com.arerti.portal.entity.User;
import com.arerti.portal.repository.GradeSectionRepository;
import com.arerti.portal.repository.StudentRepository;
import com.arerti.portal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Year;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StudentService {

    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final GradeSectionRepository gradeSectionRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    public List<StudentResponse> findAll() {
        return studentRepository.findAll().stream()
                .map(s -> StudentResponse.from(s, sectionLabel(s.getSectionId())))
                .collect(Collectors.toList());
    }

    public StudentResponse findById(Long id) {
        Student s = studentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));
        return StudentResponse.from(s, sectionLabel(s.getSectionId()));
    }

    public StudentResponse findByUsername(String username) {
        Student s = studentRepository.findByUser_Username(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Your student profile is not set up yet. Contact the administrator."));
        return StudentResponse.from(s, sectionLabel(s.getSectionId()));
    }

    @Transactional
    public StudentResponse create(StudentCreateRequest req) {
        if (userRepository.existsByEmail(req.email()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use");

        // Auto-generate username and password
        String uid = generateUid();
        String username = uid.toLowerCase().replace("-", "");  // e.g. stu2026abc123
        String plainPassword = generatePassword();

        if (userRepository.existsByUsername(username)) {
            username = username + Year.now().getValue();
        }

        User user = User.builder()
                .username(username)
                .email(req.email())
                .password(passwordEncoder.encode(plainPassword))
                .fullName(req.fullName())
                .phone(req.phone())
                .role(Role.STUDENT)
                .enabled(true)
                .mustChangePassword(true)   // student must change on first login
                .build();
        userRepository.save(user);

        Student student = Student.builder()
                .studentUid(uid)
                .user(user)
                .dateOfBirth(req.dateOfBirth())
                .gender(req.gender())
                .guardianName(req.parentName())
                .guardianPhone(req.parentPhone())
                .enrollmentYear(req.enrollmentYear() != null ? req.enrollmentYear() : Year.now().getValue())
                .sectionId(req.sectionId())
                .build();
        studentRepository.save(student);

        auditService.log(actorUsername(), actorRole(), "CREATE", "STUDENT", uid,
                "Created student " + uid + " (" + user.getFullName() + ") — credentials sent to admin");

        // Return with generated credentials so admin can share them
        return StudentResponse.fromWithCredentials(student, sectionLabel(student.getSectionId()),
                username, plainPassword);
    }

    @Transactional
    public StudentResponse update(Long id, StudentUpdateRequest req) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));
        User user = student.getUser();

        if (!user.getEmail().equals(req.email()) && userRepository.existsByEmail(req.email()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use");

        user.setEmail(req.email());
        user.setFullName(req.fullName());
        user.setPhone(req.phone());
        userRepository.save(user);

        student.setDateOfBirth(req.dateOfBirth());
        student.setGender(req.gender());
        student.setGuardianName(req.parentName());
        student.setGuardianPhone(req.parentPhone());
        if (req.enrollmentYear() != null) student.setEnrollmentYear(req.enrollmentYear());
        student.setSectionId(req.sectionId());
        studentRepository.save(student);

        return StudentResponse.from(student, sectionLabel(student.getSectionId()));
    }

    @Transactional
    public void delete(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));
        String uid = student.getStudentUid();
        studentRepository.delete(student);
        userRepository.delete(student.getUser());
        auditService.log(actorUsername(), actorRole(), "DELETE", "STUDENT", uid,
                "Deleted student " + uid);
    }

    public long count() {
        return studentRepository.count();
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private String generateUid() {
        int year = Year.now().getValue();
        String suffix = java.util.UUID.randomUUID().toString()
                .replace("-", "").substring(0, 6).toUpperCase();
        return String.format("STU-%d-%s", year, suffix);
    }

    /** Generates a readable password: e.g. Arerti@2026 + 3 random digits */
    private String generatePassword() {
        int rand = 100 + (int)(Math.random() * 900);
        return "Arerti@" + Year.now().getValue() + rand;
    }

    private String sectionLabel(Long sectionId) {
        if (sectionId == null) return null;
        return gradeSectionRepository.findById(sectionId)
                .map(gs -> "Grade " + gs.getGrade() + " - " + gs.getSection())
                .orElse(null);
    }

    private String actorUsername() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : "system";
    }

    private String actorRole() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return "SYSTEM";
        return auth.getAuthorities().stream().findFirst()
                .map(a -> a.getAuthority().replace("ROLE_", "")).orElse("UNKNOWN");
    }
}
