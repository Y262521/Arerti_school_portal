package com.arerti.portal.service;

import com.arerti.portal.dto.GradeSectionRequest;
import com.arerti.portal.dto.GradeSectionResponse;
import com.arerti.portal.entity.GradeSection;
import com.arerti.portal.entity.Teacher;
import com.arerti.portal.repository.GradeSectionRepository;
import com.arerti.portal.repository.TeacherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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

    public GradeSectionResponse findById(Long id) {
        GradeSection gs = gradeSectionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Class not found"));
        return GradeSectionResponse.from(gs, gradeSectionRepository.countStudentsBySectionId(gs.getId()));
    }

    @Transactional
    public GradeSectionResponse create(GradeSectionRequest req) {
        if (gradeSectionRepository.existsByGradeAndSectionAndAcademicYear(
                req.grade(), req.section(), req.academicYear())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Grade " + req.grade() + " section " + req.section() + " already exists for " + req.academicYear());
        }

        GradeSection gs = GradeSection.builder()
                .grade(req.grade())
                .section(req.section())
                .academicYear(req.academicYear())
                .maxCapacity(req.maxCapacity())
                .homeroomTeacher(resolveTeacher(req.homeroomTeacherId()))
                .build();
        gradeSectionRepository.save(gs);
        return GradeSectionResponse.from(gs, 0L);
    }

    @Transactional
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
    public void delete(Long id) {
        GradeSection gs = gradeSectionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Class not found"));
        gradeSectionRepository.delete(gs);
    }

    public long count() {
        return gradeSectionRepository.count();
    }

    private Teacher resolveTeacher(Long teacherId) {
        if (teacherId == null) return null;
        return teacherRepository.findById(teacherId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Teacher not found"));
    }
}
