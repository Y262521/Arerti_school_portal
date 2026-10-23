package com.arerti.portal.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
@RequiredArgsConstructor
public class HealthController {

    private final JdbcTemplate jdbc;

    @Value("${cloudinary.cloud-name:NOT_SET}")
    private String cloudName;

    @Value("${cloudinary.api-key:NOT_SET}")
    private String apiKey;

    @Value("${cloudinary.api-secret:NOT_SET}")
    private String apiSecret;

    @GetMapping
    public Map<String, Object> health() {
        return Map.of(
                "status", "UP",
                "service", "arerti-portal-backend",
                "version", "b4f8859-UserCreationService",
                "time", Instant.now().toString(),
                "storage_configured", !cloudName.equals("NOT_SET") && !cloudName.isBlank()
        );
    }

    /**
     * Test endpoint: tries to insert a test user and immediately deletes it.
     * Returns the exact error if it fails.
     * Access: GET /api/health/test-insert
     */
    @GetMapping("/test-insert")
    public Map<String, Object> testInsert() {
        String testUsername = "test_" + System.currentTimeMillis();
        String testEmail = testUsername + "@test.com";
        try {
            // Try inserting a user
            jdbc.update(
                "INSERT INTO users (username, email, password, full_name, role, enabled, must_change_password) " +
                "VALUES (?, ?, 'hash', 'Test User', 'VICE_DIRECTOR', true, true)",
                testUsername, testEmail
            );
            // Clean up immediately
            jdbc.update("DELETE FROM users WHERE username = ?", testUsername);
            return Map.of("result", "SUCCESS", "username", testUsername, "email", testEmail);
        } catch (Exception e) {
            return Map.of(
                "result", "FAILED",
                "error", e.getClass().getSimpleName(),
                "message", e.getMessage() != null ? e.getMessage() : "null",
                "cause", e.getCause() != null ? e.getCause().getMessage() : "null"
            );
        }
    }
     * and the last 20 user rows. Used to debug registration conflicts.
     * Access: GET /api/health/db-diag
     */
    @GetMapping("/db-diag")
    public Map<String, Object> dbDiag() {
        List<Map<String, Object>> columns = jdbc.queryForList(
            "SELECT column_name, data_type, is_nullable, column_default " +
            "FROM information_schema.columns " +
            "WHERE table_name = 'users' ORDER BY ordinal_position"
        );
        List<Map<String, Object>> constraints = jdbc.queryForList(
            "SELECT tc.constraint_name, tc.constraint_type, kcu.column_name " +
            "FROM information_schema.table_constraints tc " +
            "JOIN information_schema.key_column_usage kcu " +
            "  ON tc.constraint_name = kcu.constraint_name " +
            "WHERE tc.table_name = 'users' " +
            "ORDER BY tc.constraint_type, kcu.column_name"
        );
        List<Map<String, Object>> recentUsers = jdbc.queryForList(
            "SELECT id, username, email, role, enabled, created_at " +
            "FROM users ORDER BY id DESC LIMIT 20"
        );
        List<Map<String, Object>> orphanVd = jdbc.queryForList(
            "SELECT u.id, u.username, u.email, u.role FROM users u " +
            "WHERE u.role = 'VICE_DIRECTOR' " +
            "AND u.id NOT IN (SELECT user_id FROM vice_directors WHERE user_id IS NOT NULL)"
        );
        List<Map<String, Object>> allVd = jdbc.queryForList(
            "SELECT v.id, v.employee_id, v.user_id, u.username, u.email " +
            "FROM vice_directors v LEFT JOIN users u ON v.user_id = u.id"
        );
        List<Map<String, Object>> vdConstraints = jdbc.queryForList(
            "SELECT tc.constraint_name, tc.constraint_type, kcu.column_name " +
            "FROM information_schema.table_constraints tc " +
            "JOIN information_schema.key_column_usage kcu " +
            "  ON tc.constraint_name = kcu.constraint_name " +
            "WHERE tc.table_name IN ('vice_directors','supervisors','teachers') " +
            "ORDER BY tc.table_name, tc.constraint_type"
        );
        return Map.of(
            "usersColumns", columns,
            "constraints", constraints,
            "recentUsers", recentUsers,
            "orphanViceDirectors", orphanVd,
            "allViceDirectors", allVd,
            "staffTableConstraints", vdConstraints
        );
    }
}
