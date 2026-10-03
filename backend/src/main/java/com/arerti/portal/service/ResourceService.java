package com.arerti.portal.service;

import com.arerti.portal.dto.ResourceResponse;
import com.arerti.portal.entity.Resource;
import com.arerti.portal.repository.ResourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ResourceService {

    private final ResourceRepository resourceRepository;
    private final FileStorageService fileStorageService;
    private final AuditService auditService;

    public List<ResourceResponse> findAll() {
        return resourceRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(ResourceResponse::from).collect(Collectors.toList());
    }

    /** ADMIN sees everything; others see GENERAL + resources targeted at their role. */
    public List<ResourceResponse> findForAudience(String role) {
        return resourceRepository.findByAudienceInOrderByCreatedAtDesc(List.of("GENERAL", role))
                .stream().map(ResourceResponse::from).collect(Collectors.toList());
    }

    public ResourceResponse findById(String id) {
        return ResourceResponse.from(get(id));
    }

    public ResourceResponse upload(MultipartFile file, String title, String description,
                                    String audience, Long sectionId, String subject) {
        String storedName = fileStorageService.store(file);

        Resource resource = Resource.builder()
                .title(title)
                .description(description)
                .audience(audience != null ? audience.toUpperCase() : "GENERAL")
                .sectionId(sectionId)
                .subject(subject)
                .fileName(file.getOriginalFilename())
                .storedFileName(storedName)
                .contentType(file.getContentType())
                .sizeBytes(file.getSize())
                .uploadedBy(actorUsername())
                .build();
        resourceRepository.save(resource);

        auditService.log(actorUsername(), actorRole(), "UPLOAD", "RESOURCE", resource.getId(),
                "Uploaded resource \"" + title + "\" (" + file.getOriginalFilename() + ")");
        return ResourceResponse.from(resource);
    }

    public org.springframework.core.io.Resource download(String id) {
        Resource resource = get(id);
        UrlResource file = (UrlResource) fileStorageService.loadAsResource(resource.getStoredFileName());
        auditService.log(actorUsername(), actorRole(), "DOWNLOAD", "RESOURCE", id,
                "Downloaded resource \"" + resource.getTitle() + "\"");
        return file;
    }

    public ResourceResponse metaOf(String id) {
        return ResourceResponse.from(get(id));
    }

    public void delete(String id) {
        Resource resource = get(id);
        fileStorageService.delete(resource.getStoredFileName());
        resourceRepository.delete(resource);
        auditService.log(actorUsername(), actorRole(), "DELETE", "RESOURCE", id,
                "Deleted resource \"" + resource.getTitle() + "\"");
    }

    public long count() {
        return resourceRepository.count();
    }

    private Resource get(String id) {
        return resourceRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not found"));
    }

    private String actorUsername() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : "system";
    }

    private String actorRole() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return "SYSTEM";
        return auth.getAuthorities().stream().findFirst()
                .map(a -> a.getAuthority().replace("ROLE_", "")).orElse("UNKNOWN");
    }
}
