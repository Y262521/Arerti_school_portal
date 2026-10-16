package com.arerti.portal.repository;

import com.arerti.portal.entity.Supervisor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface SupervisorRepository extends JpaRepository<Supervisor, Long> {

    @Query("SELECT s.employeeId FROM Supervisor s WHERE s.employeeId LIKE 'AGSPS-S%'")
    List<String> findSupervisorIds();

    boolean existsByEmployeeId(String employeeId);

    Optional<Supervisor> findByUser_Username(String username);
}
