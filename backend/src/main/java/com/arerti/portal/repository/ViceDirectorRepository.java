package com.arerti.portal.repository;

import com.arerti.portal.entity.ViceDirector;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ViceDirectorRepository extends JpaRepository<ViceDirector, Long> {

    @Query("SELECT v.employeeId FROM ViceDirector v WHERE v.employeeId LIKE 'AGSPS-VD%'")
    List<String> findVdIds();

    boolean existsByEmployeeId(String employeeId);

    Optional<ViceDirector> findByUser_Username(String username);
}
