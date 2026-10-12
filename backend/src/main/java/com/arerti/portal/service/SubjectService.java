package com.arerti.portal.service;

import com.arerti.portal.dto.SubjectRequest;
import com.arerti.portal.dto.SubjectResponse;
import com.arerti.portal.entity.ClassSubjectAssignment;
import com.arerti.portal.entity.GradeCurriculum;
import com.arerti.portal.entity.GradeEntry;
import com.arerti.portal.entity.RegradePermission;
import com.arerti.portal.entity.Subject;
import com.arerti.portal.repository.ClassSubjectAssignmentRepository;
import com.arerti.portal.repository.GradeCurriculumRepository;
import com.arerti.portal.repository.GradeEntryRepository;
import com.arerti.portal.repository.RegradePermissionRepository;
import com.arerti.portal.repository.SubjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
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
public class SubjectService {

    private final SubjectRepository subjectRepository;
    private final GradeCurriculumRepository curriculumRepository;
    private final ClassSubjectAssignmentRepository assignmentRepository;
    private final GradeEntryRepository gradeEntryRepository;
    private final RegradePermissionRepository regradePermissionRepository;
    private final AuditService auditService;
    private final JdbcTemplate jdbc;

    @Cacheable("subjects")
    public List<SubjectResponse> findAll() {
        return subjectRepository.findAll().stream()
                .map(SubjectResponse::from).collect(Collectors.toList());
    }

    public SubjectResponse findById(Long id) {
        return SubjectResponse.from(get(id));
    }

    @CacheEvict(value = {"subjects", "classes"}, allEntries = true)
    public SubjectResponse create(SubjectRequest req) {
        if (subjectRepository.existsByName(req.name()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Subject already exists");
        Subject s = Subject.builder()
                .name(req.name())
                .code(req.code())
                .applicableGrades(req.applicableGrades())
                .build();
        return SubjectResponse.from(subjectRepository.save(s));
    }

    @CacheEvict(value = {"subjects", "classes"}, allEntries = true)
    public SubjectResponse update(Long id, SubjectRequest req) {
        Subject s = get(id);
        s.setName(req.name());
        s.setCode(req.code());
        s.setApplicableGrades(req.applicableGrades());
        return SubjectResponse.from(subjectRepository.save(s));
    }

    @Transactional
    @CacheEvict(value = {"subjects", "classes"}, allEntries = true)
    public void delete(Long id) {
        Subject s = get(id);
        Long subjectId = s.getId();

        // 1. Delete curriculum definitions referencing this subject
        jdbc.update("DELETE FROM grade_curricula WHERE subject_id = ?", subjectId);

        // 2. Delete class subject assignments referencing this subject
        jdbc.update("DELETE FROM class_subject_assignments WHERE subject_id = ?", subjectId);

        // 3. Delete regrade permissions referencing this subject
        jdbc.update("DELETE FROM regrade_permissions WHERE subject_id = ?", subjectId);

        // 4. Delete grade entries referencing this subject
        jdbc.update("DELETE FROM grade_entries WHERE subject_id = ?", subjectId);

        // 5. Delete subject
        jdbc.update("DELETE FROM subjects WHERE id = ?", subjectId);

        auditService.log(actorUsername(), actorRole(), "DELETE", "SUBJECT", String.valueOf(s.getId()),
                "Deleted subject " + s.getName());
    }

    private Subject get(Long id) {
        return subjectRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Subject not found"));
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
