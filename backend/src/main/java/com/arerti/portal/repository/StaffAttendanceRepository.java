package com.arerti.portal.repository;

import com.arerti.portal.entity.StaffAttendance;
import com.arerti.portal.entity.Teacher;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface StaffAttendanceRepository extends JpaRepository<StaffAttendance, Long> {
    Optional<StaffAttendance> findByTeacherAndDate(Teacher teacher, LocalDate date);
    List<StaffAttendance> findByDate(LocalDate date);
    List<StaffAttendance> findByTeacherOrderByDateDesc(Teacher teacher);
    List<StaffAttendance> findByDateBetween(LocalDate startDate, LocalDate endDate);
}
