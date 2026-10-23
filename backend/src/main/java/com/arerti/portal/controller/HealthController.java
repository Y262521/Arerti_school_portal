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
                "time", Instant.now().toString(),
                "storage_configured", !cloudName.equals("NOT_SET") && !cloudName.isBlank()
        );
    }

    /**
     * Diagnostic: shows all unique constraints on the users table
     * and the last 20 user rows. Used to debug registration conflicts.
     * Access: GET /api/health/db-diag
     */
    @GetMapping("/db-diag")
    public Map<String, Object> dbDiag() {
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
        return Map.of(
            "constraints", constraints,
            "recentUsers", recentUsers,
            "orphanViceDirectors", orphanVd
        );
    }
}
