package com.arerti.portal.repository;

import com.arerti.portal.entity.RegistrationWindow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface RegistrationWindowRepository extends JpaRepository<RegistrationWindow, Long> {

    List<RegistrationWindow> findAllByOrderByCreatedAtDesc();

    /** Find the currently active window — OPEN status and today within dates */
    @Query("SELECT w FROM RegistrationWindow w WHERE w.status = 'OPEN' " +
           "AND w.startDate <= :today AND w.endDate >= :today")
    Optional<RegistrationWindow> findActive(LocalDate today);

    /** Find ANY open window regardless of dates — used as fallback */
    Optional<RegistrationWindow> findFirstByStatusOrderByCreatedAtDesc(
            RegistrationWindow.WindowStatus status);

    /** Find active window for a specific academic year */
    @Query("SELECT w FROM RegistrationWindow w WHERE w.status = 'OPEN' " +
           "AND w.academicYear = :academicYear AND w.startDate <= :today AND w.endDate >= :today")
    Optional<RegistrationWindow> findActiveForYear(String academicYear, LocalDate today);
}
