package com.arerti.portal.service;

import com.arerti.portal.dto.ParentLinkRequest;
import com.arerti.portal.dto.ParentLinkResponse;
import com.arerti.portal.entity.ParentLink;
import com.arerti.portal.entity.Student;
import com.arerti.portal.entity.User;
import com.arerti.portal.repository.GradeSectionRepository;
import com.arerti.portal.repository.ParentLinkRepository;
import com.arerti.portal.repository.StudentRepository;
import com.arerti.portal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ParentLinkService {

    private final ParentLinkRepository parentLinkRepository;
    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final GradeSectionRepository gradeSectionRepository;
    private final AuditService auditService;

    public List<ParentLinkResponse> findChildren(String parentUsername) {
        User parent = getParent(parentUsername);
        return parentLinkRepository.findByParentId(parent.getId()).stream()
                .map(link -> ParentLinkResponse.from(link, sectionLabel(link.getStudent().getSectionId())))
                .collect(Collectors.toList());
    }

    @Transactional
    public ParentLinkResponse link(String parentUsername, ParentLinkRequest req) {
        User parent = getParent(parentUsername);
        Student student = studentRepository.findByStudentUid(req.studentUid().trim().toUpperCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No student found with that ID. Double-check the Student UID with the school office."));

        if (parentLinkRepository.existsByParentIdAndStudentId(parent.getId(), student.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This child is already linked to your account");
        }

        ParentLink link = ParentLink.builder()
                .parent(parent)
                .student(student)
                .relationship(req.relationship())
                .build();
        parentLinkRepository.save(link);

        auditService.log(parentUsername, "PARENT", "LINK", "PARENT_LINK", student.getStudentUid(),
                "Linked child " + student.getStudentUid() + " (" + student.getUser().getFullName() + ")");

        return ParentLinkResponse.from(link, sectionLabel(student.getSectionId()));
    }

    @Transactional
    public void unlink(String parentUsername, Long linkId) {
        User parent = getParent(parentUsername);
        ParentLink link = parentLinkRepository.findById(linkId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Link not found"));
        if (!link.getParent().getId().equals(parent.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This link does not belong to your account");
        }
        String uid = link.getStudent().getStudentUid();
        parentLinkRepository.delete(link);
        auditService.log(parentUsername, "PARENT", "UNLINK", "PARENT_LINK", uid,
                "Unlinked child " + uid);
    }

    private User getParent(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unknown user"));
    }

    private String sectionLabel(Long sectionId) {
        if (sectionId == null) return null;
        return gradeSectionRepository.findById(sectionId)
                .map(gs -> "Grade " + gs.getGrade() + " - " + gs.getSection())
                .orElse(null);
    }
}
