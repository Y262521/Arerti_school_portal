package com.arerti.portal.repository;

import com.arerti.portal.entity.RegistrationWindow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface RegistrationWindowRepository extends JpaRepository<RegistrationWindow, Long> {

    List<RegistrationWindow> findAllByOrderByCreatedAtDesc();

    @Query("SELECT w FROM RegistrationWindow w WHERE w.status = 'OPEN' " +
           "AND w.endDatetime >= :now")
    Optional<RegistrationWindow> findActive(LocalDateTime now);

    List<RegistrationWindow> findAllByStatus(RegistrationWindow.WindowStatus status);

    Optional<RegistrationWindow> findFirstByStatusOrderByCreatedAtDesc(
            RegistrationWindow.WindowStatus status);
}
