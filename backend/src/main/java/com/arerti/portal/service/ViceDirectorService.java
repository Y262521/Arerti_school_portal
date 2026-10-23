package com.arerti.portal.service;

import com.arerti.portal.dto.ViceDirectorCreateRequest;
import com.arerti.portal.dto.ViceDirectorResponse;
import com.arerti.portal.entity.Role;
import com.arerti.portal.entity.User;
import com.arerti.portal.entity.ViceDirector;
import com.arerti.portal.repository.UserRepository;
import com.arerti.portal.repository.ViceDirectorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ViceDirectorService {

    private final ViceDirectorRepository viceDirectorRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbc;

    public List<ViceDirectorResponse> findAll() {
        return viceDirectorRepository.findAll().stream()
                .map(ViceDirectorResponse::from)
                .collect(Collectors.toList());
    }

    public ViceDirectorResponse create(ViceDirectorCreateRequest req) {
        // Purge orphan users with this email first
        purgeOrphanUserByEmail(req.email());

        // Check email conflict
        if (emailExistsInDb(req.email()))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "This email address is already registered. Please use a different email.");

        String employeeId = generateEmployeeId();
        String plainPassword = generatePassword();
        String baseUsername = employeeId.toLowerCase().replace("-", "");
        String username;
        int attempts = 0;
        do {
            int rand = 100 + (int)(Math.random() * 900);
            username = baseUsername + rand;
            attempts++;
        } while (usernameExistsInDb(username) && attempts < 50);

        String fullName = (req.firstName() + " " + req.fatherName()).trim();
        log.info("VD create: employeeId={}, username={}, email={}", employeeId, username, req.email());

        // Save user using standard JPA - simple and reliable
        User user = User.builder()
                .username(username)
                .email(req.email())
                .password(passwordEncoder.encode(plainPassword))
                .fullName(fullName)
                .phone(req.phone() != null ? req.phone() : "")
                .role(Role.VICE_DIRECTOR)
                .enabled(true)
                .mustChangePassword(true)
                .build();

        // Save user in its own transaction so it's committed before VD profile
        User savedUser = saveUserInNewTransaction(user);
        log.info("VD user saved with id={}", savedUser.getId());

        // Now save ViceDirector in its own transaction
        ViceDirector vd = saveViceDirectorInNewTransaction(savedUser, employeeId, req);

        auditService.log(actorUsername(), actorRole(), "CREATE", "VICE_DIRECTOR", employeeId,
                "Created vice director " + employeeId);

        log.info("VD created successfully: employeeId={}, username={}", employeeId, username);
        return ViceDirectorResponse.fromWithCredentials(vd, username, plainPassword);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public User saveUserInNewTransaction(User user) {
        return userRepository.save(user);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public ViceDirector saveViceDirectorInNewTransaction(User user, String employeeId, ViceDirectorCreateRequest req) {
        ViceDirector vd = ViceDirector.builder()
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
        return viceDirectorRepository.save(vd);
    }

    @Transactional
    public ViceDirectorResponse update(Long id, ViceDirectorCreateRequest req) {
        ViceDirector vd = viceDirectorRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vice Director not found"));
        User user = vd.getUser();

        if (!user.getEmail().equalsIgnoreCase(req.email()) && emailExistsInDb(req.email()))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "This email address is already registered. Please use a different email.");

        String fullName = (req.firstName() + " " + req.fatherName()).trim();
        user.setEmail(req.email());
        user.setFullName(fullName);
        user.setPhone(req.phone());
        userRepository.save(user);

        vd.setFirstName(req.firstName());
        vd.setFatherName(req.fatherName());
        vd.setGrandfatherName(req.grandfatherName());
        vd.setGender(req.gender());
        vd.setDateOfBirth(req.dateOfBirth());
        if (req.photoUrl() != null) vd.setPhotoUrl(req.photoUrl());
        if (req.qualificationCertUrl() != null) vd.setQualificationCertUrl(req.qualificationCertUrl());
        if (req.idDocUrl() != null) vd.setIdDocUrl(req.idDocUrl());
        viceDirectorRepository.save(vd);

        return ViceDirectorResponse.from(vd);
    }

    @Transactional
    public void delete(Long id) {
        ViceDirector vd = viceDirectorRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vice Director not found"));
        Long vdId = vd.getId();
        Long userId = vd.getUser() != null ? vd.getUser().getId() : null;
        String empId = vd.getEmployeeId();

        jdbc.update("DELETE FROM vice_directors WHERE id = ?", vdId);
        if (userId != null) {
            try { jdbc.update("DELETE FROM parent_links WHERE parent_user_id = ?", userId); } catch (Exception ignored) {}
            try { jdbc.update("DELETE FROM supervisor_class_assignments WHERE supervisor_id = ?", userId); } catch (Exception ignored) {}
            jdbc.update("DELETE FROM users WHERE id = ?", userId);
        }

        auditService.log(actorUsername(), actorRole(), "DELETE", "VICE_DIRECTOR", empId,
                "Deleted vice director " + empId);
    }

    public long count() {
        return viceDirectorRepository.count();
    }

    private synchronized String generateEmployeeId() {
        List<String> ids = viceDirectorRepository.findVdIds();
        int maxNum = 0;
        for (String id : ids) {
            if (id != null && id.toUpperCase().startsWith("AGSPS-VD")) {
                try {
                    int val = Integer.parseInt(id.substring(8).trim());
                    if (val > maxNum) maxNum = val;
                } catch (NumberFormatException ignored) {}
            }
        }
        int next = maxNum + 1;
        String candidate = "AGSPS-VD" + next;
        while (viceDirectorRepository.existsByEmployeeId(candidate)) {
            next++;
            candidate = "AGSPS-VD" + next;
        }
        return candidate;
    }

    private String generatePassword() {
        int rand = 100 + (int)(Math.random() * 900);
        return "Arerti@" + LocalDate.now().getYear() + rand;
    }

    private boolean usernameExistsInDb(String username) {
        Integer count = jdbc.queryForObject(
            "SELECT COUNT(*) FROM users WHERE LOWER(username) = LOWER(?)",
            Integer.class, username);
        return count != null && count > 0;
    }

    private boolean emailExistsInDb(String email) {
        Integer count = jdbc.queryForObject(
            "SELECT COUNT(*) FROM users WHERE LOWER(email) = LOWER(?)",
            Integer.class, email);
        return count != null && count > 0;
    }

    private void purgeOrphanUserByEmail(String email) {
        try {
            int deleted = jdbc.update(
                "DELETE FROM users WHERE LOWER(email) = LOWER(?) " +
                "AND role = 'VICE_DIRECTOR' " +
                "AND id NOT IN (SELECT user_id FROM vice_directors WHERE user_id IS NOT NULL)",
                email);
            if (deleted > 0) log.info("Purged {} orphan VICE_DIRECTOR user(s) with email={}", deleted, email);
        } catch (Exception e) {
            log.warn("Could not purge orphan VD user for email {}: {}", email, e.getMessage());
        }
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
