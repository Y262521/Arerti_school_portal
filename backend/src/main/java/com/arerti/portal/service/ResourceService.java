package com.arerti.portal.service;

import com.arerti.portal.dto.ResourceResponse;
import com.arerti.portal.entity.Resource;
import com.arerti.portal.repository.ResourceRepository;
import lombok.RequiredArgsConstructor;
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
    private final CloudinaryService cloudinaryService;
    private final AuditService auditService;

    public List<ResourceResponse> findAll() {
        return resourceRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(ResourceResponse::from).collect(Collectors.toList());
    }

    public List<ResourceResponse> findForAudience(String role, String username) {
        List<Resource> byAudience = resourceRepository
                .findByAudienceInOrderByCreatedAtDesc(List.of("GENERAL", role));
        List<Resource> myUploads = resourceRepository
                .findByUploadedByOrderByCreatedAtDesc(username);

        List<String> seen = myUploads.stream().map(Resource::getId).collect(Collectors.toList());
        List<Resource> merged = new java.util.ArrayList<>(myUploads);
        byAudience.stream().filter(r -> !seen.contains(r.getId())).forEach(merged::add);
        merged.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
        return merged.stream().map(ResourceResponse::from).collect(Collectors.toList());
    }

    public ResourceResponse findById(String id) {
        return ResourceResponse.from(get(id));
    }

    /**
     * Uploads file to Cloudinary and saves the permanent URL.
     * Downloads are now direct Cloudinary URLs — no backend streaming needed.
     */
    public ResourceResponse upload(MultipartFile file, String title, String description,
                                    String audience, Long sectionId, String subject) {
        // Upload to Cloudinary — returns a permanent HTTPS URL
        String downloadUrl = cloudinaryService.upload(file, "resources");

        Resource resource = Resource.builder()
                .title(title)
                .description(description)
                .audience(audience != null ? audience.toUpperCase() : "GENERAL")
                .sectionId(sectionId)
                .subject(subject)
                .fileName(file.getOriginalFilename())
                .storedFileName(downloadUrl)  // keep for backward compat
                .downloadUrl(downloadUrl)
                .contentType(file.getContentType())
                .sizeBytes(file.getSize())
                .uploadedBy(actorUsername())
                .build();
        resourceRepository.save(resource);

        auditService.log(actorUsername(), actorRole(), "UPLOAD", "RESOURCE", resource.getId(),
                "Uploaded resource \"" + title + "\"");
        return ResourceResponse.from(resource);
    }

    /**
     * Returns the download URL for a resource.
     * For new resources (Cloudinary): returns the direct URL.
     * For legacy resources (GridFS/filesystem): returns null (file may be gone).
     */
    public String getDownloadUrl(String id) {
        Resource resource = get(id);
        if (resource.getDownloadUrl() != null) return resource.getDownloadUrl();
        if (resource.getStoredFileName() != null &&
                resource.getStoredFileName().startsWith("http")) {
            return resource.getStoredFileName();
        }
        return null;
    }

    public void logDownload(String id, String username) {
        try {
            Resource resource = get(id);
            auditService.log(username, "USER", "DOWNLOAD", "RESOURCE", id,
                    "Downloaded resource \"" + resource.getTitle() + "\"");
        } catch (Exception ignored) {}
    }

    public ResourceResponse metaOf(String id) {
        return ResourceResponse.from(get(id));
    }

    /** Save metadata for a file already uploaded to Cloudinary by the browser */
    public ResourceResponse saveMeta(String downloadUrl, String fileName, String contentType,
                                      Long sizeBytes, String title, String description,
                                      String audience, Long sectionId, String subject) {
        Resource resource = Resource.builder()
                .title(title)
                .description(description)
                .audience(audience != null ? audience.toUpperCase() : "GENERAL")
                .sectionId(sectionId)
                .subject(subject)
                .fileName(fileName)
                .storedFileName(downloadUrl)
                .downloadUrl(downloadUrl)
                .contentType(contentType != null ? contentType : "application/octet-stream")
                .sizeBytes(sizeBytes != null ? sizeBytes : 0)
                .uploadedBy(actorUsername())
                .build();
        resourceRepository.save(resource);

        auditService.log(actorUsername(), actorRole(), "UPLOAD", "RESOURCE", resource.getId(),
                "Uploaded resource \"" + title + "\"");
        return ResourceResponse.from(resource);
    }

    public void delete(String id, String username, boolean isAdmin) {
        Resource resource = get(id);
        // Only admin OR the uploader can delete
        if (!isAdmin && !resource.getUploadedBy().equals(username)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Only the director or the teacher who uploaded this resource can delete it");
        }
        resourceRepository.delete(resource);
        auditService.log(username, isAdmin ? "ADMIN" : "TEACHER", "DELETE", "RESOURCE", id,
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
