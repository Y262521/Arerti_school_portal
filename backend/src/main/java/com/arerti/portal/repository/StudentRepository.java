package com.arerti.portal.repository;

import com.arerti.portal.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {
    Optional<Student> findByStudentUid(String studentUid);
    boolean existsByStudentUid(String studentUid);
    Optional<Student> findByUser_Username(String username);

    @Query("SELECT s.studentUid FROM Student s WHERE s.studentUid LIKE 'AGSPS-%'")
    List<String> findAgspsUids();
}
