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

    @Transactional
    public ViceDirectorResponse create(ViceDirectorCreateRequest req) {
        // Check email first — gives user a specific, actionable message
        if (userRepository.existsByEmail(req.email()))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "This email address is already registered. Please use a different email.");

        String employeeId = generateEmployeeId();
        String baseUsername = employeeId.toLowerCase().replace("-", "");
        String username = baseUsername;
        String plainPassword = generatePassword();

        // Ensure username is unique — increment a counter suffix until it is
        int suffix = 1;
        while (userRepository.existsByUsername(username)) {
            username = baseUsername + suffix;
            suffix++;
        }

        String fullName = req.firstName() + " " + req.fatherName();

        User user = User.builder()
                .username(username)
                .email(req.email())
                .password(passwordEncoder.encode(plainPassword))
                .fullName(fullName)
                .phone(req.phone())
                .role(Role.VICE_DIRECTOR)
                .enabled(true)
                .mustChangePassword(true)
                .build();
        userRepository.save(user);

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
        viceDirectorRepository.save(vd);

        auditService.log(actorUsername(), actorRole(), "CREATE", "VICE_DIRECTOR", employeeId,
                "Created vice director " + employeeId);

        return ViceDirectorResponse.fromWithCredentials(vd, username, plainPassword);
    }

    @Transactional
    public ViceDirectorResponse update(Long id, ViceDirectorCreateRequest req) {
        ViceDirector vd = viceDirectorRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vice Director not found"));
        User user = vd.getUser();

        if (!user.getEmail().equals(req.email()) && userRepository.existsByEmail(req.email()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use");

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
