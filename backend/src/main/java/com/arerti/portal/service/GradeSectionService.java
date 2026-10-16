package com.arerti.portal.service;

import com.arerti.portal.dto.GradeSectionRequest;
import com.arerti.portal.dto.GradeSectionResponse;
import com.arerti.portal.entity.GradeSection;
import com.arerti.portal.entity.Teacher;
import com.arerti.portal.repository.ClassSubjectAssignmentRepository;
import com.arerti.portal.repository.GradeSectionRepository;
import com.arerti.portal.repository.RegradePermissionRepository;
import com.arerti.portal.repository.StudentRepository;
import com.arerti.portal.repository.SupervisorClassAssignmentRepository;
import com.arerti.portal.repository.TeacherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GradeSectionService {

    private final GradeSectionRepository gradeSectionRepository;
    private final TeacherRepository teacherRepository;
    private final ClassSubjectAssignmentRepository assignmentRepository;
    private final RegradePermissionRepository regradePermissionRepository;
    private final StudentRepository studentRepository;
    private final SupervisorClassAssignmentRepository supervisorClassAssignmentRepository;
    private final AuditService auditService;
    private final JdbcTemplate jdbc;
    @Lazy
    private final ClassSubjectAssignmentService assignmentService;

    @Cacheable("classes")
    public List<GradeSectionResponse> findAll() {
        return gradeSectionRepository.findAll().stream()
                .map(gs -> GradeSectionResponse.from(gs,
                        gradeSectionRepository.countStudentsBySectionId(gs.getId())))
                .collect(Collectors.toList());
    }

    /** Returns only classes where the given teacher is the homeroom teacher */
    public List<GradeSectionResponse> findMyClasses(String teacherUsername) {
        Teacher teacher = teacherRepository.findByUser_Username(teacherUsername).orElse(null);
        if (teacher == null) return List.of();
        return gradeSectionRepository.findByHomeroomTeacher(teacher).stream()
                .map(gs -> GradeSectionResponse.from(gs,
                        gradeSectionRepository.countStudentsBySectionId(gs.getId())))
                .collect(Collectors.toList());
    }

    /** Returns only classes assigned to the given supervisor */
    public List<GradeSectionResponse> findSupervisedClasses(String supervisorUsername) {
        return supervisorClassAssignmentRepository.findBySupervisor_Username(supervisorUsername).stream()
                .map(a -> GradeSectionResponse.from(a.getSection(),
                        gradeSectionRepository.countStudentsBySectionId(a.getSection().getId())))
                .collect(Collectors.toList());
    }

    public GradeSectionResponse findById(Long id) {
        GradeSection gs = gradeSectionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Class not found"));
        return GradeSectionResponse.from(gs, gradeSectionRepository.countStudentsBySectionId(gs.getId()));
    }

    @Transactional
    @CacheEvict(value = "classes", allEntries = true)
    public GradeSectionResponse create(GradeSectionRequest req) {
        // For Grade 11-12, uniqueness includes stream (Natural and Social are separate classes)
        // For Grade 9-10, stream is always null
        if (req.grade() >= 11) {
            if (req.stream() == null || req.stream().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Stream (NATURAL_SCIENCE or SOCIAL_SCIENCE) is required for Grade 11 and 12");
            }
            if (gradeSectionRepository.existsByGradeAndSectionAndAcademicYearAndStream(
                    req.grade(), req.section(), req.academicYear(), req.stream())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Grade " + req.grade() + " section " + req.section() + " (" +
                        req.stream().replace("_", " ") + ") already exists for " + req.academicYear());
            }
        } else {
            if (gradeSectionRepository.existsByGradeAndSectionAndAcademicYear(
                    req.grade(), req.section(), req.academicYear())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Grade " + req.grade() + " Section " + req.section() + " already exists for " + req.academicYear() + ".");
            }
        }

        GradeSection gs = GradeSection.builder()
                .grade(req.grade())
                .section(req.section())
                .academicYear(req.academicYear())
                .maxCapacity(req.maxCapacity())
                .homeroomTeacher(resolveTeacher(req.homeroomTeacherId()))
                .stream(req.grade() >= 11 ? req.stream() : null)
                .build();
        gradeSectionRepository.save(gs);

        // Auto-apply the standardized curriculum for this grade+stream
        assignmentService.applyGradeCurriculum(gs);

        return GradeSectionResponse.from(gs, 0L);
    }

    @Transactional
    @CacheEvict(value = "classes", allEntries = true)
    public GradeSectionResponse update(Long id, GradeSectionRequest req) {
        GradeSection gs = gradeSectionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Class not found"));

        gs.setGrade(req.grade());
        gs.setSection(req.section());
        gs.setAcademicYear(req.academicYear());
        gs.setMaxCapacity(req.maxCapacity());
        gs.setHomeroomTeacher(resolveTeacher(req.homeroomTeacherId()));
        gradeSectionRepository.save(gs);

        return GradeSectionResponse.from(gs, gradeSectionRepository.countStudentsBySectionId(gs.getId()));
    }

    @Transactional
    @CacheEvict(value = "classes", allEntries = true)
    public void delete(Long id) {
        GradeSection gs = gradeSectionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Class not found"));
        Long sectionId = gs.getId();

        // 1. Unassign all students belonging to this section
        jdbc.update("UPDATE students SET section_id = NULL WHERE section_id = ?", sectionId);

        // 2. Remove regrade permissions referencing this section
        jdbc.update("DELETE FROM regrade_permissions WHERE section_id = ?", sectionId);

        // 3. Remove all subject assignments for this section
        jdbc.update("DELETE FROM class_subject_assignments WHERE section_id = ?", sectionId);

        // 4. Delete the class section
        jdbc.update("DELETE FROM grade_sections WHERE id = ?", sectionId);

        auditService.log(actorUsername(), actorRole(), "DELETE", "CLASS", String.valueOf(gs.getId()),
                "Deleted class Grade " + gs.getGrade() + " - Section " + gs.getSection());
    }

    public long count() {
        return gradeSectionRepository.count();
    }

    private Teacher resolveTeacher(Long teacherId) {
        if (teacherId == null) return null;
        return teacherRepository.findById(teacherId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Teacher not found"));
    }

    private String actorUsername() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : "system";
    }

    private String actorRole() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getAuthorities().isEmpty()) return "UNKNOWN";
        return auth.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");
    }
}
