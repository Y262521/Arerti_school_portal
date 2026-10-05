package com.arerti.portal.repository;

import com.arerti.portal.entity.RegistrationAssignment;
import com.arerti.portal.entity.RegistrationWindow;
import com.arerti.portal.entity.Teacher;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RegistrationAssignmentRepository extends JpaRepository<RegistrationAssignment, Long> {

    List<RegistrationAssignment> findByWindow(RegistrationWindow window);

    Optional<RegistrationAssignment> findByWindowAndTeacher(RegistrationWindow window, Teacher teacher);

    boolean existsByWindowAndTeacher(RegistrationWindow window, Teacher teacher);

    List<RegistrationAssignment> findByTeacher(Teacher teacher);
}
