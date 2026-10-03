package com.arerti.portal.service;

import com.arerti.portal.dto.NoticeRequest;
import com.arerti.portal.dto.NoticeResponse;
import com.arerti.portal.entity.Notice;
import com.arerti.portal.repository.NoticeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NoticeService {

    private final NoticeRepository noticeRepository;

    public List<NoticeResponse> findAll() {
        return noticeRepository.findAllByOrderByPinnedDescCreatedAtDesc()
                .stream().map(NoticeResponse::from).collect(Collectors.toList());
    }

    /** Filter by audience — returns GENERAL notices + notices targeting the given role */
    public List<NoticeResponse> findForAudience(String role) {
        return noticeRepository.findByAudienceInOrderByPinnedDescCreatedAtDesc(
                List.of("GENERAL", role))
                .stream().map(NoticeResponse::from).collect(Collectors.toList());
    }

    public NoticeResponse findById(String id) {
        return NoticeResponse.from(get(id));
    }

    public NoticeResponse create(NoticeRequest req, String postedBy) {
        Notice notice = Notice.builder()
                .title(req.title())
                .body(req.body())
                .audience(req.audience() != null ? req.audience().toUpperCase() : "GENERAL")
                .priority(req.priority() != null ? req.priority().toUpperCase() : "MEDIUM")
                .pinned(req.pinned())
                .postedBy(postedBy)
                .build();
        return NoticeResponse.from(noticeRepository.save(notice));
    }

    public NoticeResponse update(String id, NoticeRequest req) {
        Notice notice = get(id);
        notice.setTitle(req.title());
        notice.setBody(req.body());
        notice.setAudience(req.audience() != null ? req.audience().toUpperCase() : "GENERAL");
        notice.setPriority(req.priority() != null ? req.priority().toUpperCase() : "MEDIUM");
        notice.setPinned(req.pinned());
        return NoticeResponse.from(noticeRepository.save(notice));
    }

    public void delete(String id) {
        noticeRepository.delete(get(id));
    }

    public long count() {
        return noticeRepository.count();
    }

    private Notice get(String id) {
        return noticeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notice not found"));
    }
}
