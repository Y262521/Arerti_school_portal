package com.arerti.portal.service;

import com.arerti.portal.dto.GradeEntryWindowRequest;
import com.arerti.portal.dto.GradeEntryWindowResponse;
import com.arerti.portal.dto.PostponeRequest;
import com.arerti.portal.entity.GradeEntryWindow;
import com.arerti.portal.repository.GradeEntryWindowRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GradeEntryWindowService {

    private final GradeEntryWindowRepository windowRepository;

    public List<GradeEntryWindowResponse> findAll() {
        return windowRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(GradeEntryWindowResponse::from).collect(Collectors.toList());
    }

    /** Check if grade entry is currently allowed for a given semester+year */
    public boolean isGradeEntryOpen(String academicYear, Integer semester) {
        return windowRepository.findActive(academicYear, semester, LocalDateTime.now()).isPresent();
    }

    /** Check if ANY grade entry window is open (used for general access check) */
    public boolean isAnyGradeEntryOpen() {
        return !windowRepository.findAllActive(LocalDateTime.now()).isEmpty();
    }

    @Transactional
    public GradeEntryWindowResponse open(GradeEntryWindowRequest req) {
        GradeEntryWindow w = GradeEntryWindow.builder()
                .academicYear(req.academicYear())
                .semester(req.semester())
                .startDatetime(req.startDatetime())
                .endDatetime(req.endDatetime())
                .status(GradeEntryWindow.WindowStatus.OPEN)
                .note(req.note())
                .openedBy(actorUsername())
                .postponeCount(0)
                .build();
        return GradeEntryWindowResponse.from(windowRepository.save(w));
    }

    @Transactional
    public GradeEntryWindowResponse postpone(Long id, PostponeRequest req) {
        GradeEntryWindow w = getWindow(id);
        if (w.getStatus() != GradeEntryWindow.WindowStatus.OPEN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Window is already closed");
        }
        if (req.newEndDatetime().isBefore(w.getEndDatetime())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "New end time must be later than current end time");
        }
        w.setEndDatetime(req.newEndDatetime());
        w.setPostponeCount(w.getPostponeCount() + 1);
        if (req.reason() != null && !req.reason().isBlank()) {
            w.setNote((w.getNote() != null ? w.getNote() + " | " : "") + "Postponed: " + req.reason());
        }
        return GradeEntryWindowResponse.from(windowRepository.save(w));
    }

    @Transactional
    public GradeEntryWindowResponse close(Long id) {
        GradeEntryWindow w = getWindow(id);
        w.setStatus(GradeEntryWindow.WindowStatus.CLOSED);
        return GradeEntryWindowResponse.from(windowRepository.save(w));
    }

    private GradeEntryWindow getWindow(Long id) {
        return windowRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Grade entry window not found"));
    }

    private String actorUsername() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : "system";
    }
}
