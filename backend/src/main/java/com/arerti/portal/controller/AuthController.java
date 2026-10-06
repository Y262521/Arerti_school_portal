package com.arerti.portal.controller;

import com.arerti.portal.dto.AdminResetPasswordRequest;
import com.arerti.portal.dto.AuthResponse;
import com.arerti.portal.dto.ChangePasswordRequest;
import com.arerti.portal.dto.LoginRequest;
import com.arerti.portal.dto.RegisterRequest;
import com.arerti.portal.dto.UserLookupResponse;
import com.arerti.portal.entity.User;
import com.arerti.portal.repository.UserRepository;
import com.arerti.portal.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /** Public — anyone can request an account. Admin must then enable / role-check. */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.ok(authService.register(req));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    /** Admin-only sanity check that the JWT + role wiring works. */
    @GetMapping("/admin/ping")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> adminPing() {
        return ResponseEntity.ok("admin-ok");
    }

    /**
     * Any authenticated user can change their own password.
     */
    @PostMapping("/change-password")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest req,
                                                Authentication auth) {
        authService.changePassword(auth.getName(), req);
        return ResponseEntity.noContent().build();
    }

    // ── Admin: user lookup and credential management ──────────────────────────

    /**
     * Admin searches for a user by name, username or email.
     * Returns matching users so admin can see their username and reset password.
     */
    @GetMapping("/admin/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserLookupResponse>> searchUsers(
            @RequestParam(required = false, defaultValue = "") String q) {
        List<User> users;
        if (q.isBlank()) {
            users = userRepository.findAll();
        } else {
            String lower = q.toLowerCase();
            users = userRepository.findAll().stream()
                    .filter(u -> u.getFullName().toLowerCase().contains(lower)
                            || u.getUsername().toLowerCase().contains(lower)
                            || u.getEmail().toLowerCase().contains(lower))
                    .toList();
        }
        return ResponseEntity.ok(users.stream().map(UserLookupResponse::from).toList());
    }

    /**
     * Admin resets any user's password.
     * The new password is returned once so admin can share it with the user.
     */
    @PostMapping("/admin/users/{userId}/reset-password")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<java.util.Map<String, String>> adminResetPassword(
            @PathVariable Long userId,
            @Valid @RequestBody AdminResetPasswordRequest req,
            Authentication auth) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        user.setPassword(passwordEncoder.encode(req.newPassword()));
        user.setMustChangePassword(true);
        userRepository.save(user);
        authService.logAdminReset(auth.getName(), user.getUsername());
        return ResponseEntity.ok(java.util.Map.of(
                "message", "Password reset successfully",
                "username", user.getUsername(),
                "newPassword", req.newPassword()
        ));
    }
}
