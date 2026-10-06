package com.arerti.portal.repository;

import com.arerti.portal.entity.GradeEntryWindow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface GradeEntryWindowRepository extends JpaRepository<GradeEntryWindow, Long> {

    List<GradeEntryWindow> findAllByOrderByCreatedAtDesc();

    /** Find an active grade entry window for a specific semester and year */
    @Query("SELECT w FROM GradeEntryWindow w WHERE w.status = 'OPEN' " +
           "AND w.academicYear = :academicYear AND w.semester = :semester " +
           "AND w.startDatetime <= :now AND w.endDatetime >= :now")
    Optional<GradeEntryWindow> findActive(String academicYear, Integer semester, LocalDateTime now);

    /** Find any open window (for checking if grade entry is allowed at all) */
    @Query("SELECT w FROM GradeEntryWindow w WHERE w.status = 'OPEN' " +
           "AND w.startDatetime <= :now AND w.endDatetime >= :now")
    List<GradeEntryWindow> findAllActive(LocalDateTime now);
}
