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

    @GetMapping
    public Map<String, Object> health() {
        return Map.of(
                "status", "UP",
                "service", "arerti-portal-backend",
                "version", "v2.0-sequence-sync-fix",
                "time", Instant.now().toString(),
                "storage_configured", !cloudName.equals("NOT_SET") && !cloudName.isBlank()
        );
    }

    /** Test: insert a user row and delete it immediately. Shows exact DB error if it fails. */
    @GetMapping("/test-insert")
    public Map<String, Object> testInsert() {
        String testUsername = "test_" + System.currentTimeMillis();
        String testEmail = testUsername + "@test.com";
        try {
            jdbc.update(
                "INSERT INTO users (username, email, password, full_name, role, enabled, must_change_password) " +
                "VALUES (?, ?, 'hash', 'Test User', 'VICE_DIRECTOR', true, true)",
                testUsername, testEmail
            );
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

    /** Diagnostic: DB schema and recent users. */
    @GetMapping("/db-diag")
    public Map<String, Object> dbDiag() {
        List<Map<String, Object>> columns = jdbc.queryForList(
            "SELECT column_name, data_type, is_nullable FROM information_schema.columns " +
            "WHERE table_name = 'users' ORDER BY ordinal_position"
        );
        List<Map<String, Object>> constraints = jdbc.queryForList(
            "SELECT tc.constraint_name, tc.constraint_type, kcu.column_name " +
            "FROM information_schema.table_constraints tc " +
            "JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name " +
            "WHERE tc.table_name = 'users' ORDER BY tc.constraint_type, kcu.column_name"
        );
        List<Map<String, Object>> recentUsers = jdbc.queryForList(
            "SELECT id, username, email, role, enabled, created_at FROM users ORDER BY id DESC LIMIT 20"
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
        List<Map<String, Object>> staffConstraints = jdbc.queryForList(
            "SELECT tc.constraint_name, tc.constraint_type, kcu.column_name " +
            "FROM information_schema.table_constraints tc " +
            "JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name " +
            "WHERE tc.table_name IN ('vice_directors','supervisors','teachers') " +
            "ORDER BY tc.table_name, tc.constraint_type"
        );

        Long userCount = 0L;
        Long maxUserId = 0L;
        try {
            userCount = jdbc.queryForObject("SELECT COUNT(*) FROM users", Long.class);
            maxUserId = jdbc.queryForObject("SELECT COALESCE(MAX(id), 0) FROM users", Long.class);
        } catch (Exception ignored) {}

        List<Map<String, Object>> seqDiag = List.of();
        try {
            seqDiag = jdbc.queryForList("SELECT last_value, is_called FROM users_id_seq");
        } catch (Exception ignored) {}

        List<Map<String, Object>> searchMekbib = List.of();
        try {
            searchMekbib = jdbc.queryForList("SELECT id, username, email, role FROM users WHERE LOWER(email) LIKE '%mekbib%' OR LOWER(username) LIKE '%mekbib%'");
        } catch (Exception ignored) {}

        java.util.Map<String, Object> result = new java.util.HashMap<>();
        result.put("usersColumns", columns);
        result.put("constraints", constraints);
        result.put("recentUsers", recentUsers);
        result.put("orphanViceDirectors", orphanVd);
        result.put("allViceDirectors", allVd);
        result.put("staffTableConstraints", staffConstraints);
        result.put("userCount", userCount);
        result.put("maxUserId", maxUserId);
        result.put("usersIdSeq", seqDiag);
        result.put("searchMekbib", searchMekbib);
        return result;
    }
}
