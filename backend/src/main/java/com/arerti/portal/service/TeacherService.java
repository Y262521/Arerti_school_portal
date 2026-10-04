package com.arerti.portal.service;

import com.arerti.portal.dto.TeacherCreateRequest;
import com.arerti.portal.dto.TeacherUpdateRequest;
import com.arerti.portal.dto.TeacherResponse;
import com.arerti.portal.entity.Role;
import com.arerti.portal.entity.Teacher;
import com.arerti.portal.entity.User;
import com.arerti.portal.repository.TeacherRepository;
import com.arerti.portal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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
public class TeacherService {

    private final TeacherRepository teacherRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

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

        // Auto-generate employee ID, username, and password
        String employeeId = generateEmployeeId();
        String username = employeeId.toLowerCase().replace("-", ""); // e.g. tch2026abc123
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
                .role(Role.TEACHER)
                .enabled(true)
                .mustChangePassword(true)
                .build();
        userRepository.save(user);

        Teacher teacher = Teacher.builder()
                .user(user)
                .employeeId(employeeId)
                .qualification(req.qualification())
                .specialization(req.specialization())
                .hireDate(req.hireDate() != null ? req.hireDate() : LocalDate.now())
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

        user.setEmail(req.email());
        user.setFullName(req.fullName());
        user.setPhone(req.phone());
        userRepository.save(user);

        teacher.setQualification(req.qualification());
        teacher.setSpecialization(req.specialization());
        if (req.hireDate() != null) teacher.setHireDate(req.hireDate());
        teacherRepository.save(teacher);

        return TeacherResponse.from(teacher);
    }

    @Transactional
    public void delete(Long id) {
        Teacher teacher = teacherRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Teacher not found"));
        teacherRepository.delete(teacher);
        userRepository.delete(teacher.getUser());
    }

    public long count() {
        return teacherRepository.count();
    }

    private String generateEmployeeId() {
        int year = Year.now().getValue();
        String suffix = java.util.UUID.randomUUID().toString()
                .replace("-", "").substring(0, 6).toUpperCase();
        return String.format("TCH-%d-%s", year, suffix);
    }

    private String generatePassword() {
        int rand = 100 + (int)(Math.random() * 900);
        return "Arerti@" + Year.now().getValue() + rand;
    }
}
