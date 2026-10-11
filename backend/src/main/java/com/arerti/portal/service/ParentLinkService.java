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

        // Verify relationship to prevent unauthorized student linking
        boolean phoneMatches = phonesMatch(parent.getPhone(), student.getGuardianPhone());
        boolean nameMatches = namesMatch(parent.getFullName(), student.getGuardianName());
        if (!phoneMatches && !nameMatches) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Verification failed: Your phone number or name does not match the guardian records on file for this student. Please contact the school office to verify or update your contact information.");
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

    private boolean phonesMatch(String p1, String p2) {
        if (p1 == null || p2 == null || p1.isBlank() || p2.isBlank()) return false;
        String d1 = p1.replaceAll("\\D", "");
        String d2 = p2.replaceAll("\\D", "");
        if (d1.startsWith("251")) d1 = d1.substring(3);
        if (d2.startsWith("251")) d2 = d2.substring(3);
        if (d1.startsWith("0")) d1 = d1.substring(1);
        if (d2.startsWith("0")) d2 = d2.substring(1);
        return d1.length() >= 8 && d1.equals(d2);
    }

    private boolean namesMatch(String n1, String n2) {
        if (n1 == null || n2 == null || n1.isBlank() || n2.isBlank()) return false;
        String s1 = n1.trim().toLowerCase();
        String s2 = n2.trim().toLowerCase();
        return s1.contains(s2) || s2.contains(s1);
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
