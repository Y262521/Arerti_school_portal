package com.arerti.portal.service;

import com.arerti.portal.dto.AuthResponse;
import com.arerti.portal.dto.ChangePasswordRequest;
import com.arerti.portal.dto.LoginRequest;
import com.arerti.portal.dto.RegisterRequest;
import com.arerti.portal.entity.User;
import com.arerti.portal.repository.UserRepository;
import com.arerti.portal.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final AuditService auditService;

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByUsername(req.username())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already taken");
        }
        if (userRepository.existsByEmail(req.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use");
        }

        User user = User.builder()
                .username(req.username())
                .email(req.email())
                .password(passwordEncoder.encode(req.password()))
                .fullName(req.fullName())
                .phone(req.phone())
                .role(req.role())
                .enabled(true)
                .mustChangePassword(false)
                .build();

        userRepository.save(user);
        auditService.log(user.getUsername(), user.getRole().name(), "REGISTER", "AUTH", user.getUsername(),
                "Account registered");
        return issueToken(user);
    }

    public AuthResponse login(LoginRequest req) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(req.username(), req.password())
            );
        } catch (Exception e) {
            auditService.log(req.username(), "UNKNOWN", "LOGIN_FAILED", "AUTH", req.username(),
                    "Failed login attempt");
            throw e;
        }
        User user = userRepository.findByUsername(req.username())
                .or(() -> userRepository.findByEmail(req.username()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
        auditService.log(user.getUsername(), user.getRole().name(), "LOGIN", "AUTH", user.getUsername(),
                "Logged in");
        return issueToken(user);
    }

    private AuthResponse issueToken(User user) {
        String token = jwtService.generateToken(user);
        return new AuthResponse(token, user.getUsername(), user.getFullName(), user.getRole());
    }

    @Transactional
    public void changePassword(String username, ChangePasswordRequest req) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (!passwordEncoder.matches(req.currentPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
        }

        if (req.newPassword().equals(req.currentPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "New password must differ from the current password");
        }

        user.setPassword(passwordEncoder.encode(req.newPassword()));
        user.setMustChangePassword(false);
        userRepository.save(user);

        auditService.log(username, user.getRole().name(), "CHANGE_PASSWORD", "AUTH", username,
                "Password changed successfully");
    }
}
