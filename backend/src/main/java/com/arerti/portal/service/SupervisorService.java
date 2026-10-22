package com.arerti.portal.service;

import com.arerti.portal.dto.GradeSectionResponse;
import com.arerti.portal.dto.SupervisorCreateRequest;
import com.arerti.portal.dto.SupervisorResponse;
import com.arerti.portal.entity.GradeSection;
import com.arerti.portal.entity.Role;
import com.arerti.portal.entity.Supervisor;
import com.arerti.portal.entity.SupervisorClassAssignment;
import com.arerti.portal.entity.User;
import com.arerti.portal.repository.GradeSectionRepository;
import com.arerti.portal.repository.SupervisorClassAssignmentRepository;
import com.arerti.portal.repository.SupervisorRepository;
import com.arerti.portal.repository.UserRepository;
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
public class SupervisorService {

    private final SupervisorRepository supervisorRepository;
    private final UserRepository userRepository;
    private final GradeSectionRepository gradeSectionRepository;
    private final SupervisorClassAssignmentRepository assignmentRepository;
    private final AuditService auditService;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbc;

    public List<SupervisorResponse> findAll() {
        return supervisorRepository.findAll().stream()
                .map(SupervisorResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public SupervisorResponse create(SupervisorCreateRequest req) {
        // Check email first — gives user a specific, actionable message
        if (userRepository.existsByEmail(req.email()))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "This email address is already registered. Please use a different email.");

        String employeeId = generateEmployeeId();
        String plainPassword = generatePassword();

        // Build a guaranteed-unique username: employeeId-slug + random 3-digit suffix
        // checked against DB in a loop until confirmed free
        String baseUsername = employeeId.toLowerCase().replace("-", "");
        String username;
        do {
            int rand = 100 + (int)(Math.random() * 900);
            username = baseUsername + rand;
        } while (userRepository.existsByUsername(username));

        String fullName = req.firstName() + " " + req.fatherName();

        User user = User.builder()
                .username(username)
                .email(req.email())
                .password(passwordEncoder.encode(plainPassword))
                .fullName(fullName)
                .phone(req.phone())
                .role(Role.SUPERVISOR)
                .enabled(true)
                .mustChangePassword(true)
                .build();
        userRepository.save(user);

        Supervisor supervisor = Supervisor.builder()
                .user(user)
                .employeeId(employeeId)
                .firstName(req.firstName())
                .fatherName(req.fatherName())
                .grandfatherName(req.grandfatherName())
                .gender(req.gender())
                .dateOfBirth(req.dateOfBirth())
                .photoUrl(req.photoUrl())
                .qualificationCertUrl(req.qualificationCertUrl())
                .idDocUrl(req.idDocUrl())
                .build();
        supervisorRepository.save(supervisor);

        auditService.log(actorUsername(), actorRole(), "CREATE", "SUPERVISOR", employeeId,
                "Created supervisor " + employeeId);

        return SupervisorResponse.fromWithCredentials(supervisor, username, plainPassword);
    }

    @Transactional
    public void delete(Long id) {
        Supervisor s = supervisorRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Supervisor not found"));
        Long sId = s.getId();
        Long userId = s.getUser() != null ? s.getUser().getId() : null;
        String empId = s.getEmployeeId();

        // Remove class assignments first
        if (userId != null) {
            jdbc.update("DELETE FROM supervisor_class_assignments WHERE supervisor_id = ?", userId);
        }
        jdbc.update("DELETE FROM supervisors WHERE id = ?", sId);
        if (userId != null) {
            jdbc.update("DELETE FROM users WHERE id = ?", userId);
        }

        auditService.log(actorUsername(), actorRole(), "DELETE", "SUPERVISOR", empId,
                "Deleted supervisor " + empId);
    }

    @Transactional
    public void assignClass(Long supervisorId, Long sectionId) {
        Supervisor supervisor = supervisorRepository.findById(supervisorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Supervisor not found"));
        GradeSection section = gradeSectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Class not found"));
        User supervisorUser = supervisor.getUser();

        if (assignmentRepository.existsBySupervisorIdAndSectionId(supervisorUser.getId(), sectionId)) {
            return; // already assigned — idempotent
        }

        SupervisorClassAssignment assignment = SupervisorClassAssignment.builder()
                .supervisor(supervisorUser)
                .section(section)
                .build();
        assignmentRepository.save(assignment);
    }

    @Transactional
    public void removeClass(Long supervisorId, Long sectionId) {
        Supervisor supervisor = supervisorRepository.findById(supervisorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Supervisor not found"));
        Long supervisorUserId = supervisor.getUser().getId();
        assignmentRepository.deleteBySupervisorIdAndSectionId(supervisorUserId, sectionId);
    }

    public List<GradeSectionResponse> getAssignedClasses(Long supervisorId) {
        Supervisor supervisor = supervisorRepository.findById(supervisorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Supervisor not found"));
        return assignmentRepository.findBySupervisorId(supervisor.getUser().getId()).stream()
                .map(a -> GradeSectionResponse.from(a.getSection(),
                        gradeSectionRepository.countStudentsBySectionId(a.getSection().getId())))
                .collect(Collectors.toList());
    }

    public List<GradeSectionResponse> getMyClasses(String username) {
        return assignmentRepository.findBySupervisor_Username(username).stream()
                .map(a -> GradeSectionResponse.from(a.getSection(),
                        gradeSectionRepository.countStudentsBySectionId(a.getSection().getId())))
                .collect(Collectors.toList());
    }

    private synchronized String generateEmployeeId() {
        List<String> ids = supervisorRepository.findSupervisorIds();
        int maxNum = 0;
        for (String id : ids) {
            if (id != null && id.toUpperCase().startsWith("AGSPS-S")) {
                try {
                    int val = Integer.parseInt(id.substring(7).trim());
                    if (val > maxNum) maxNum = val;
                } catch (NumberFormatException ignored) {}
            }
        }
        int next = maxNum + 1;
        String candidate = "AGSPS-S" + next;
        while (supervisorRepository.existsByEmployeeId(candidate)) {
            next++;
            candidate = "AGSPS-S" + next;
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
