package com.arerti.portal.service;

import com.arerti.portal.dto.ClassSubjectAssignmentRequest;
import com.arerti.portal.dto.ClassSubjectAssignmentResponse;
import com.arerti.portal.dto.GradeCurriculumResponse;
import com.arerti.portal.entity.*;
import com.arerti.portal.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClassSubjectAssignmentService {

    private final ClassSubjectAssignmentRepository assignmentRepository;
    private final GradeSectionRepository sectionRepository;
    private final SubjectRepository subjectRepository;
    private final TeacherRepository teacherRepository;
    private final GradeCurriculumRepository curriculumRepository;

    // ----------------------------------------------------------------
    // Curriculum management
    // ----------------------------------------------------------------

    public List<GradeCurriculumResponse> getCurriculum(Integer grade) {
        return curriculumRepository.findByGradeOrderBySortOrderAsc(grade)
                .stream().map(GradeCurriculumResponse::from).collect(Collectors.toList());
    }

    @Transactional
    public GradeCurriculumResponse addToCurriculum(Integer grade, Long subjectId) {
        if (curriculumRepository.existsByGradeAndSubjectId(grade, subjectId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Subject already in Grade " + grade + " curriculum");
        }
        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Subject not found"));
        long order = curriculumRepository.findByGradeOrderBySortOrderAsc(grade).size();
        GradeCurriculum entry = GradeCurriculum.builder()
                .grade(grade)
                .subject(subject)
                .sortOrder((int) order)
                .build();
        return GradeCurriculumResponse.from(curriculumRepository.save(entry));
    }

    @Transactional
    public void removeFromCurriculum(Integer grade, Long subjectId) {
        curriculumRepository.deleteByGradeAndSubjectId(grade, subjectId);
    }

    // ----------------------------------------------------------------
    // Auto-apply curriculum when a class is created
    // ----------------------------------------------------------------

    /**
     * Called by GradeSectionService.create() — auto-creates one
     * ClassSubjectAssignment (teacher=null) per subject in the grade's curriculum.
     */
    @Transactional
    public void applyGradeCurriculum(GradeSection section) {
        List<GradeCurriculum> curriculum =
                curriculumRepository.findByGradeOrderBySortOrderAsc(section.getGrade());
        for (GradeCurriculum c : curriculum) {
            if (!assignmentRepository.existsBySectionAndSubjectId(section, c.getSubject().getId())) {
                ClassSubjectAssignment a = ClassSubjectAssignment.builder()
                        .section(section)
                        .subject(c.getSubject())
                        .teacher(null)          // admin assigns teacher later
                        .academicYear(section.getAcademicYear())
                        .archived(false)
                        .build();
                assignmentRepository.save(a);
            }
        }
    }

    // ----------------------------------------------------------------
    // Per-class assignment management
    // ----------------------------------------------------------------

    public List<ClassSubjectAssignmentResponse> getForSection(Long sectionId) {
        GradeSection section = getSection(sectionId);
        return assignmentRepository.findBySectionAndArchivedFalse(section)
                .stream().map(ClassSubjectAssignmentResponse::from).collect(Collectors.toList());
    }

    public List<ClassSubjectAssignmentResponse> getAllForSection(Long sectionId) {
        GradeSection section = getSection(sectionId);
        return assignmentRepository.findBySectionOrderBySubjectNameAsc(section)
                .stream().map(ClassSubjectAssignmentResponse::from).collect(Collectors.toList());
    }

    @Transactional
    public ClassSubjectAssignmentResponse assign(Long sectionId, ClassSubjectAssignmentRequest req) {
        GradeSection section = getSection(sectionId);
        Subject subject = subjectRepository.findById(req.subjectId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Subject not found"));
        Teacher teacher = req.teacherId() != null
                ? teacherRepository.findById(req.teacherId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Teacher not found"))
                : null;

        // Upsert — update existing or create new
        ClassSubjectAssignment assignment = assignmentRepository
                .findBySectionAndSubjectId(section, req.subjectId())
                .orElse(ClassSubjectAssignment.builder()
                        .section(section)
                        .subject(subject)
                        .academicYear(section.getAcademicYear())
                        .archived(false)
                        .build());

        assignment.setTeacher(teacher);
        return ClassSubjectAssignmentResponse.from(assignmentRepository.save(assignment));
    }

    /**
     * Assignments are NEVER hard-deleted — this throws 403 to enforce the rule.
     * Archiving happens only via the End Term flow.
     */
    public void protectDelete() {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Class-subject assignments cannot be deleted. Use End Term to archive them.");
    }

    // ----------------------------------------------------------------
    // End-of-year transition
    // ----------------------------------------------------------------

    /**
     * Archives all active assignments for the given academic year
     * and unassigns all students from their current sections.
     * The class, its subjects, and teacher mappings are preserved for audit.
     */
    @Transactional
    public int endTerm(String academicYear) {
        List<ClassSubjectAssignment> active =
                assignmentRepository.findByAcademicYearAndArchivedFalse(academicYear);
        active.forEach(a -> a.setArchived(true));
        assignmentRepository.saveAll(active);
        return active.size();
    }

    // ----------------------------------------------------------------
    private GradeSection getSection(Long id) {
        return sectionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Class not found"));
    }
}
