package com.arerti.portal.service;

import com.arerti.portal.dto.SubjectRequest;
import com.arerti.portal.dto.SubjectResponse;
import com.arerti.portal.entity.Subject;
import com.arerti.portal.repository.SubjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubjectService {

    private final SubjectRepository subjectRepository;

    @Cacheable("subjects")
    public List<SubjectResponse> findAll() {
        return subjectRepository.findAll().stream()
                .map(SubjectResponse::from).collect(Collectors.toList());
    }

    public SubjectResponse findById(Long id) {
        return SubjectResponse.from(get(id));
    }

    @CacheEvict(value = "subjects", allEntries = true)
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

    @CacheEvict(value = "subjects", allEntries = true)
    public SubjectResponse update(Long id, SubjectRequest req) {
        Subject s = get(id);
        s.setName(req.name());
        s.setCode(req.code());
        s.setApplicableGrades(req.applicableGrades());
        return SubjectResponse.from(subjectRepository.save(s));
    }

    @CacheEvict(value = "subjects", allEntries = true)
    public void delete(Long id) {
        subjectRepository.delete(get(id));
    }

    private Subject get(Long id) {
        return subjectRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Subject not found"));
    }
}
