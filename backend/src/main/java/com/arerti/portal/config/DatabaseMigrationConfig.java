package com.arerti.portal.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Runs lightweight schema migrations at startup that Hibernate's ddl-auto=update
 * cannot handle on its own (e.g. dropping/replacing existing constraints).
 *
 * Grade 11-12 classes now need (grade, section, academic_year, stream) to be unique,
 * not just (grade, section, academic_year). The old constraint must be dropped first
 * so Hibernate can apply the new one from the @Table annotation.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseMigrationConfig implements ApplicationRunner {

    private final JdbcTemplate jdbc;

    @Override
    public void run(ApplicationArguments args) {
        syncDatabaseSequences();
        migrateGradeSectionUniqueConstraint();
        dropLegacyObsoleteTables();
        migrateAdminToDirector();
        cleanOrphanStaffUsers();
    }

    /**
     * Synchronizes all PostgreSQL primary key sequences with the MAX(id) of their respective tables.
     * Fixes primary key collisions (e.g. users_pkey) when rows were inserted with explicit IDs
     * or imported/seeded, leaving the auto-increment sequence behind.
     */
    public void syncDatabaseSequences() {
        try {
            // First run the universal query for all PostgreSQL auto-increment / identity sequences
            jdbc.execute(
                "DO $$ " +
                "DECLARE " +
                "    r RECORD; " +
                "    max_id bigint; " +
                "BEGIN " +
                "    FOR r IN " +
                "        SELECT c.relname AS table_name, " +
                "               a.attname AS column_name, " +
                "               s.relname AS sequence_name " +
                "        FROM pg_class c " +
                "        JOIN pg_attribute a ON a.attrelid = c.oid " +
                "        JOIN pg_depend d ON d.refobjid = c.oid AND d.refobjsubid = a.attnum " +
                "        JOIN pg_class s ON s.oid = d.objid " +
                "        WHERE c.relkind = 'r' " +
                "          AND s.relkind = 'S' " +
                "          AND d.deptype IN ('a', 'i') " +
                "    LOOP " +
                "        BEGIN " +
                "            EXECUTE format('SELECT COALESCE(MAX(%I), 0) + 1 FROM %I', r.column_name, r.table_name) INTO max_id; " +
                "            EXECUTE format('SELECT setval(%L, %s, false)', r.sequence_name, max_id); " +
                "        EXCEPTION WHEN OTHERS THEN " +
                "            NULL; " +
                "        END; " +
                "    END LOOP; " +
                "END $$;"
            );
            log.info("Successfully synchronized all PostgreSQL database sequences.");
        } catch (Exception e) {
            log.warn("Universal sequence synchronization note (safe if not PostgreSQL): {}", e.getMessage());
            // Fallback for known tables using pg_get_serial_sequence
            String[] tables = {
                "users", "vice_directors", "supervisors", "teachers", "students",
                "parents", "parent_links", "grade_sections", "subjects",
                "curriculums", "audit_logs"
            };
            for (String table : tables) {
                try {
                    jdbc.execute(
                        "SELECT setval(pg_get_serial_sequence('" + table + "', 'id'), " +
                        "COALESCE((SELECT MAX(id) FROM " + table + "), 0) + 1, false)"
                    );
                } catch (Exception ignored) {}
            }
        }
    }

    private void migrateAdminToDirector() {
        try {
            jdbc.execute("UPDATE users SET full_name = 'School Director' WHERE full_name = 'System Administrator' OR full_name = 'Admin'");
            jdbc.execute("UPDATE users SET username = 'director', email = 'director@arerti.edu.et' WHERE username = 'admin'");
            log.info("Successfully updated administrator title and username to School Director.");
        } catch (Exception e) {
            log.warn("Could not migrate admin user to director: {}", e.getMessage());
        }
    }

    /**
     * Removes orphan user rows — VICE_DIRECTOR/SUPERVISOR/TEACHER users that have
     * no corresponding profile row. These are left behind when a delete partially
     * fails and cause unique-constraint violations on the next registration.
     */
    private void cleanOrphanStaffUsers() {
        try {
            int vd = jdbc.update(
                "DELETE FROM users WHERE role = 'VICE_DIRECTOR' AND id NOT IN (SELECT user_id FROM vice_directors WHERE user_id IS NOT NULL)");
            int sup = jdbc.update(
                "DELETE FROM users WHERE role = 'SUPERVISOR' AND id NOT IN (SELECT user_id FROM supervisors WHERE user_id IS NOT NULL)");
            int tea = jdbc.update(
                "DELETE FROM users WHERE role = 'TEACHER' AND id NOT IN (SELECT user_id FROM teachers WHERE user_id IS NOT NULL)");
            if (vd + sup + tea > 0) {
                log.info("Cleaned {} orphan staff user rows (VD={}, SUP={}, TEACHER={}).", vd + sup + tea, vd, sup, tea);
            }
        } catch (Exception e) {
            log.warn("Could not clean orphan staff users: {}", e.getMessage());
        }
    }

    private void dropLegacyObsoleteTables() {
        try {
            jdbc.execute("DROP TABLE IF EXISTS enrollment_records CASCADE");
            jdbc.execute("DROP TABLE IF EXISTS registration_assignments CASCADE");
            jdbc.execute("DROP TABLE IF EXISTS registration_windows CASCADE");
            log.info("Successfully cleaned up obsolete legacy tables.");
        } catch (Exception e) {
            log.warn("Could not drop legacy tables: {}", e.getMessage());
        }
    }

    /**
     * Replaces the old (grade, section, academic_year) unique constraint on
     * grade_sections with (grade, section, academic_year, stream) so that
     * Grade 11 Section A – Natural Science and Grade 11 Section A – Social Science
     * can coexist as separate classes.
     */
    private void migrateGradeSectionUniqueConstraint() {
        try {
            // Check if the new constraint already exists (idempotent)
            Integer newConstraintExists = jdbc.queryForObject(
                "SELECT COUNT(*) FROM information_schema.table_constraints " +
                "WHERE table_name = 'grade_sections' " +
                "AND constraint_type = 'UNIQUE' " +
                "AND constraint_name = 'uq_grade_section_year_stream'",
                Integer.class
            );

            if (newConstraintExists != null && newConstraintExists > 0) {
                log.debug("Grade section stream constraint already applied — skipping migration.");
                return;
            }

            // Drop ALL existing unique constraints on grade_sections so Hibernate
            // can recreate the correct one from the @Table annotation
            jdbc.execute(
                "DO $$ DECLARE r RECORD; " +
                "BEGIN " +
                "  FOR r IN " +
                "    SELECT constraint_name FROM information_schema.table_constraints " +
                "    WHERE table_name = 'grade_sections' AND constraint_type = 'UNIQUE' " +
                "  LOOP " +
                "    EXECUTE 'ALTER TABLE grade_sections DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name); " +
                "  END LOOP; " +
                "END $$;"
            );

            // Add the new stream-aware unique constraint
            jdbc.execute(
                "ALTER TABLE grade_sections " +
                "ADD CONSTRAINT uq_grade_section_year_stream " +
                "UNIQUE (grade, section, academic_year, stream)"
            );

            log.info("Successfully migrated grade_sections unique constraint to include stream column.");

        } catch (Exception e) {
            log.warn("Grade sections constraint migration encountered an issue: {}. " +
                     "This is usually safe to ignore if the constraint is already correct.", e.getMessage());
        }
    }
}
