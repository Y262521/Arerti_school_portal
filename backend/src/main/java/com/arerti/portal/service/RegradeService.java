package com.arerti.portal.service;

import com.arerti.portal.dto.RegradePermissionRequest;
import com.arerti.portal.dto.RegradePermissionResponse;
import com.arerti.portal.entity.*;
import com.arerti.portal.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RegradeService {

    private final RegradePermissionRepository regradeRepo;
    private final TeacherRepository teacherRepository;
    private final StudentRepository studentRepository;
    private final SubjectRepository subjectRepository;
    private final GradeSectionRepository sectionRepository;

    @Transactional
    public RegradePermissionResponse request(String teacherUsername, RegradePermissionRequest req) {
        Teacher teacher = teacherRepository.findByUser_Username(teacherUsername)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Teacher not found"));

        GradeSection section = sectionRepository.findById(req.sectionId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Class not found"));

        if (section.getHomeroomTeacher() == null ||
                !section.getHomeroomTeacher().getId().equals(teacher.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Only the homeroom teacher of this class can request a regrade");
        }

        Student student = studentRepository.findById(req.studentId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));

        Subject subject = subjectRepository.findById(req.subjectId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Subject not found"));

        if (regradeRepo.existsByTeacher_IdAndStudent_IdAndSubject_IdAndTermAndAcademicYearAndStatus(
                teacher.getId(), req.studentId(), req.subjectId(),
                req.term(), req.academicYear(), RegradePermission.RegradeStatus.PENDING)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A regrade request for this student and subject is already pending");
        }

        RegradePermission perm = RegradePermission.builder()
                .teacher(teacher)
                .student(student)
                .subject(subject)
                .section(section)
                .term(req.term())
                .academicYear(req.academicYear())
                .reason(req.reason())
                .status(RegradePermission.RegradeStatus.PENDING)
                .build();

        return RegradePermissionResponse.from(regradeRepo.save(perm));
    }

    @Transactional
    public RegradePermissionResponse resolve(Long id, boolean approve,
                                              String adminNote, String adminUsername) {
        RegradePermission perm = regradeRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Regrade request not found"));

        if (perm.getStatus() != RegradePermission.RegradeStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This request has already been " + perm.getStatus().name().toLowerCase());
        }

        perm.setStatus(approve
                ? RegradePermission.RegradeStatus.APPROVED
                : RegradePermission.RegradeStatus.REJECTED);
        perm.setAdminNote(adminNote);
        perm.setGrantedBy(adminUsername);
        perm.setResolvedAt(Instant.now());

        return RegradePermissionResponse.from(regradeRepo.save(perm));
    }

    @Transactional
    public void markUsed(Long teacherId, Long studentId, Long subjectId,
                         Integer term, String academicYear) {
        regradeRepo.findActiveByTeacherAndStudentAndSubjectAndTerm(
                        teacherId, studentId, subjectId, term, academicYear)
                .ifPresent(p -> {
                    p.setStatus(RegradePermission.RegradeStatus.USED);
                    p.setResolvedAt(Instant.now());
                    regradeRepo.save(p);
                });
    }

    public List<RegradePermissionResponse> findAll() {
        return regradeRepo.findAllByOrderByCreatedAtDesc()
                .stream().map(RegradePermissionResponse::from).collect(Collectors.toList());
    }

    public List<RegradePermissionResponse> findPending() {
        return regradeRepo.findByStatusOrderByCreatedAtDesc(RegradePermission.RegradeStatus.PENDING)
                .stream().map(RegradePermissionResponse::from).collect(Collectors.toList());
    }

    public List<RegradePermissionResponse> findMyRequests(String teacherUsername) {
        Teacher teacher = teacherRepository.findByUser_Username(teacherUsername).orElse(null);
        if (teacher == null) return List.of();
        return regradeRepo.findByTeacher_IdOrderByCreatedAtDesc(teacher.getId())
                .stream().map(RegradePermissionResponse::from).collect(Collectors.toList());
    }
}
