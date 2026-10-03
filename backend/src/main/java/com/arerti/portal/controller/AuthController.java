package com.arerti.portal.controller;

import com.arerti.portal.dto.AuthResponse;
import com.arerti.portal.dto.ChangePasswordRequest;
import com.arerti.portal.dto.LoginRequest;
import com.arerti.portal.dto.RegisterRequest;
import com.arerti.portal.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

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
     * Validates the current password before accepting the new one.
     */
    @PostMapping("/change-password")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest req,
                                                Authentication auth) {
        authService.changePassword(auth.getName(), req);
        return ResponseEntity.noContent().build();
    }
}
