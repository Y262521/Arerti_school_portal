package com.arerti.portal.repository;

import com.arerti.portal.entity.AttendanceRecord;
import com.arerti.portal.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<AttendanceRecord, Long> {

    List<AttendanceRecord> findByStudentOrderByDateDesc(Student student);

    List<AttendanceRecord> findByStudent_SectionIdAndDate(Long sectionId, LocalDate date);

    Optional<AttendanceRecord> findByStudentIdAndDate(Long studentId, LocalDate date);

    @Query("SELECT COUNT(a) FROM AttendanceRecord a WHERE a.student = :student AND a.status = 'PRESENT'")
    long countPresentByStudent(Student student);

    @Query("SELECT COUNT(a) FROM AttendanceRecord a WHERE a.student = :student")
    long countTotalByStudent(Student student);
}
