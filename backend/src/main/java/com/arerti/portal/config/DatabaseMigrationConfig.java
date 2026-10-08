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
        migrateGradeSectionUniqueConstraint();
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
