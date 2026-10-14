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
import org.springframework.security.crypto.password.PasswordEncoder;
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
    private final PasswordEncoder passwordEncoder;

    public List<ParentLinkResponse> findChildren(String parentUsername) {
        User parent = getParent(parentUsername);
        return parentLinkRepository.findByParentId(parent.getId()).stream()
                .map(link -> ParentLinkResponse.from(link, sectionLabel(link.getStudent().getSectionId())))
                .collect(Collectors.toList());
    }

    @Transactional
    public ParentLinkResponse link(String parentUsername, ParentLinkRequest req) {
        User parent = getParent(parentUsername);

        // Find the student by their username
        User studentUser = userRepository.findByUsername(req.studentUsername().trim().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No student account found with that username. Please check and try again."));

        // Verify the password
        if (!passwordEncoder.matches(req.studentPassword(), studentUser.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Incorrect password. Please enter your child's correct login password.");
        }

        // Make sure the account is actually a student
        if (studentUser.getRole() == null || !studentUser.getRole().name().equals("STUDENT")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "That account is not a student account.");
        }

        // Look up the student profile
        Student student = studentRepository.findByUser_Username(req.studentUsername().trim().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Student profile not found for this account."));

        // Check not already linked
        if (parentLinkRepository.existsByParentIdAndStudentId(parent.getId(), student.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This child is already linked to your account.");
        }

        ParentLink link = ParentLink.builder()
                .parent(parent)
                .student(student)
                .relationship(req.relationship())
                .build();
        parentLinkRepository.save(link);

        auditService.log(parentUsername, "PARENT", "LINK", "PARENT_LINK", student.getStudentUid(),
                "Linked child " + student.getStudentUid() + " (" + studentUser.getFullName() + ")");

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
