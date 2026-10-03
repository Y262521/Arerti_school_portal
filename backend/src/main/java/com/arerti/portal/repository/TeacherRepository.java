package com.arerti.portal.repository;

import com.arerti.portal.entity.Teacher;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TeacherRepository extends JpaRepository<Teacher, Long> {
    Optional<Teacher> findByEmployeeId(String employeeId);

    /** Efficient lookup by the associated User's username — avoids full table scan. */
    Optional<Teacher> findByUser_Username(String username);
}
