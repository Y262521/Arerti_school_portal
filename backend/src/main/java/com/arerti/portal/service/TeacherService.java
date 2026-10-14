package com.arerti.portal.service;

import com.arerti.portal.dto.TeacherCreateRequest;
import com.arerti.portal.dto.TeacherUpdateRequest;
import com.arerti.portal.dto.TeacherResponse;
import com.arerti.portal.entity.Role;
import com.arerti.portal.entity.Teacher;
import com.arerti.portal.entity.User;
import com.arerti.portal.entity.*;
import com.arerti.portal.repository.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TeacherService {

    private final TeacherRepository teacherRepository;
    private final UserRepository userRepository;
    private final GradeSectionRepository gradeSectionRepository;
    private final ClassSubjectAssignmentRepository assignmentRepository;
    private final RegistrationAssignmentRepository registrationAssignmentRepository;
    private final RegradePermissionRepository regradePermissionRepository;
    private final AttendanceRepository attendanceRepository;
    private final EnrollmentRecordRepository enrollmentRecordRepository;
    private final GradeEntryRepository gradeEntryRepository;
    private final AuditService auditService;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbc;
    @PersistenceContext
    private EntityManager entityManager;

    public List<TeacherResponse> findAll() {
        return teacherRepository.findAll().stream()
                .map(TeacherResponse::from)
                .collect(Collectors.toList());
    }

    public TeacherResponse findById(Long id) {
        Teacher t = teacherRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Teacher not found"));
        return TeacherResponse.from(t);
    }

    @Transactional
    public TeacherResponse create(TeacherCreateRequest req) {
        if (userRepository.existsByEmail(req.email()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use");

        String employeeId = generateEmployeeId();
        String username = employeeId.toLowerCase().replace("-", "");
        String plainPassword = generatePassword();

        if (userRepository.existsByUsername(username)) {
            username = username + Year.now().getValue();
        }

        // Full name from parts
        String fullName = req.firstName() + " " + req.fatherName();

        User user = User.builder()
                .username(username)
                .email(req.email())
                .password(passwordEncoder.encode(plainPassword))
                .fullName(fullName)
                .phone(req.phone())
                .role(Role.TEACHER)
                .enabled(true)
                .mustChangePassword(true)
                .build();
        userRepository.save(user);

        Teacher teacher = Teacher.builder()
                .user(user)
                .employeeId(employeeId)
                .firstName(req.firstName())
                .fatherName(req.fatherName())
                .grandfatherName(req.grandfatherName())
                .gender(req.gender())
                .dateOfBirth(req.dateOfBirth())
                .region(req.region())
                .city(req.city())
                .kebele(req.kebele())
                .houseNo(req.houseNo())
                .qualification(req.qualification())
                .specialization(req.specialization())
                .hireDate(req.hireDate() != null ? req.hireDate() : LocalDate.now())
                .photoUrl(req.photoUrl())
                .qualificationCertUrl(req.qualificationCertUrl())
                .idDocUrl(req.idDocUrl())
                .build();
        teacherRepository.save(teacher);

        return TeacherResponse.fromWithCredentials(teacher, username, plainPassword);
    }

    @Transactional
    public TeacherResponse update(Long id, TeacherUpdateRequest req) {
        Teacher teacher = teacherRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Teacher not found"));
        User user = teacher.getUser();

        if (!user.getEmail().equals(req.email()) && userRepository.existsByEmail(req.email()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use");

        String fullName = req.fullName();
        if ((fullName == null || fullName.isBlank()) && req.firstName() != null) {
            fullName = (req.firstName() + " " + (req.fatherName() != null ? req.fatherName() : "")).trim();
        }

        user.setEmail(req.email());
        if (fullName != null && !fullName.isBlank()) {
            user.setFullName(fullName);
        }
        user.setPhone(req.phone());
        userRepository.save(user);

        if (req.firstName() != null) teacher.setFirstName(req.firstName());
        if (req.fatherName() != null) teacher.setFatherName(req.fatherName());
        if (req.grandfatherName() != null) teacher.setGrandfatherName(req.grandfatherName());
        if (req.gender() != null) teacher.setGender(req.gender());
        teacher.setDateOfBirth(req.dateOfBirth());
        teacher.setRegion(req.region());
        teacher.setCity(req.city());
        teacher.setKebele(req.kebele());
        teacher.setHouseNo(req.houseNo());
        teacher.setQualification(req.qualification());
        teacher.setSpecialization(req.specialization());
        if (req.hireDate() != null) teacher.setHireDate(req.hireDate());
        if (req.photoUrl() != null) teacher.setPhotoUrl(req.photoUrl());
        if (req.qualificationCertUrl() != null) teacher.setQualificationCertUrl(req.qualificationCertUrl());
        if (req.idDocUrl() != null) teacher.setIdDocUrl(req.idDocUrl());
        teacherRepository.save(teacher);

        return TeacherResponse.from(teacher);
    }

    @Transactional
    public void delete(Long id) {
        Teacher teacher = teacherRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Teacher not found"));
        Long teacherId = teacher.getId();
        Long teacherUserId = teacher.getUser() != null ? teacher.getUser().getId() : null;
        String empId = teacher.getEmployeeId();

        // 1. Drop obsolete legacy tables if they still exist
        try {
            jdbc.execute("DROP TABLE IF EXISTS enrollment_records CASCADE");
            jdbc.execute("DROP TABLE IF EXISTS registration_assignments CASCADE");
            jdbc.execute("DROP TABLE IF EXISTS registration_windows CASCADE");
        } catch (Exception ignored) {}

        // 2. Unassign as homeroom teacher in grade_sections
        jdbc.update("UPDATE grade_sections SET homeroom_teacher_id = NULL WHERE homeroom_teacher_id = ?", teacherId);

        // 3. Unassign from class_subject_assignments
        jdbc.update("UPDATE class_subject_assignments SET teacher_id = NULL WHERE teacher_id = ?", teacherId);

        // 4. Remove registration assignments
        jdbc.update("DELETE FROM registration_assignments_v2 WHERE teacher_id = ?", teacherId);

        // 5. Remove regrade permissions
        jdbc.update("DELETE FROM regrade_permissions WHERE teacher_id = ?", teacherId);

        // 6. Unlink attendance records marked by this teacher
        jdbc.update("UPDATE attendance_records SET marked_by = NULL WHERE marked_by = ?", teacherId);

        // 7. Unlink enrollment records registered by this teacher
        jdbc.update("UPDATE enrollment_records_v2 SET registered_by = NULL WHERE registered_by = ?", teacherId);

        // 8. Unlink grade entries recorded by this teacher
        jdbc.update("UPDATE grade_entries SET recorded_by = NULL WHERE recorded_by = ?", teacherId);

        // 9. Dynamically clear ANY remaining foreign key pointing to teachers
        try {
            jdbc.execute(
                "DO $$ DECLARE r RECORD; " +
                "BEGIN " +
                "  FOR r IN ( " +
                "    SELECT tc.table_name, kcu.column_name, c.is_nullable " +
                "    FROM information_schema.table_constraints AS tc " +
                "    JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name " +
                "    JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name " +
                "    JOIN information_schema.columns AS c ON c.table_name = tc.table_name AND c.column_name = kcu.column_name " +
                "    WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = 'teachers' " +
                "  ) LOOP " +
                "    IF r.is_nullable = 'YES' THEN " +
                "      EXECUTE 'UPDATE ' || quote_ident(r.table_name) || ' SET ' || quote_ident(r.column_name) || ' = NULL WHERE ' || quote_ident(r.column_name) || ' = " + teacherId + "'; " +
                "    ELSE " +
                "      EXECUTE 'DELETE FROM ' || quote_ident(r.table_name) || ' WHERE ' || quote_ident(r.column_name) || ' = " + teacherId + "'; " +
                "    END IF; " +
                "  END LOOP; " +
                "END $$;"
            );
        } catch (Exception e) {
            log.warn("Dynamic teacher FK cleanup: {}", e.getMessage());
        }

        // 10. Delete teacher record
        jdbc.update("DELETE FROM teachers WHERE id = ?", teacherId);

        // 11. Delete teacher user account
        if (teacherUserId != null) {
            try {
                jdbc.execute(
                    "DO $$ DECLARE r RECORD; " +
                    "BEGIN " +
                    "  FOR r IN ( " +
                    "    SELECT tc.table_name, kcu.column_name " +
                    "    FROM information_schema.table_constraints AS tc " +
                    "    JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name " +
                    "    JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name " +
                    "    WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = 'users' " +
                    "  ) LOOP " +
                    "    EXECUTE 'DELETE FROM ' || quote_ident(r.table_name) || ' WHERE ' || quote_ident(r.column_name) || ' = " + teacherUserId + "'; " +
                    "  END LOOP; " +
                    "END $$;"
                );
            } catch (Exception e) {
                log.warn("Dynamic teacher user FK cleanup: {}", e.getMessage());
            }
            jdbc.update("DELETE FROM users WHERE id = ?", teacherUserId);
        }

        if (entityManager != null) {
            entityManager.clear();
        }

        auditService.log(actorUsername(), actorRole(), "DELETE", "TEACHER", empId,
                "Deleted teacher " + empId);
    }

    public long count() {
        return teacherRepository.count();
    }

    private synchronized String generateEmployeeId() {
        List<String> ids = teacherRepository.findAgsptIds();
        int maxNum = 0;
        for (String id : ids) {
            if (id != null && id.toUpperCase().startsWith("AGSPS-T")) {
                try {
                    int val = Integer.parseInt(id.substring(7).trim());
                    if (val > maxNum) maxNum = val;
                } catch (NumberFormatException ignored) {}
            }
        }
        int next = maxNum + 1;
        String candidate = "AGSPS-T" + next;
        while (teacherRepository.existsByEmployeeId(candidate)) {
            next++;
            candidate = "AGSPS-T" + next;
        }
        return candidate;
    }

    private String generatePassword() {
        int rand = 100 + (int)(Math.random() * 900);
        return "Arerti@" + LocalDate.now().getYear() + rand;
    }

    private String actorUsername() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : "system";
    }

    private String actorRole() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getAuthorities().isEmpty()) return "UNKNOWN";
        return auth.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");
    }
}
