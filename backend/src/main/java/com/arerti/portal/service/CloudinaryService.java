package com.arerti.portal.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.Map;

/**
 * Uploads files to Cloudinary and returns permanent HTTPS URLs.
 * Used for student registration documents (photos, IDs, certificates, receipts).
 */
@Service
@Slf4j
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public CloudinaryService(
            @Value("${cloudinary.cloud-name}") String cloudName,
            @Value("${cloudinary.api-key}") String apiKey,
            @Value("${cloudinary.api-secret}") String apiSecret) {
        this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key",    apiKey,
                "api_secret", apiSecret,
                "secure",     true
        ));
    }

    /**
     * Uploads a file to Cloudinary under the given folder.
     * Returns the secure HTTPS URL of the uploaded file.
     *
     * @param file   the multipart file to upload
     * @param folder e.g. "arerti/student-photos", "arerti/id-docs", "arerti/receipts"
     */
    public String upload(MultipartFile file, String folder) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File is required");
        }
        try {
            Map<?, ?> result = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder",          "arerti/" + folder,
                            "resource_type",   "auto",
                            "use_filename",    false,
                            "unique_filename", true
                    )
            );
            String url = (String) result.get("secure_url");
            if (url == null) {
                log.error("Cloudinary returned no URL. Result: {}", result);
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "Upload succeeded but no URL returned");
            }
            log.info("Uploaded to Cloudinary: {}", url);
            return url;
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Cloudinary upload failed for folder '{}': {} - {}",
                    folder, e.getClass().getSimpleName(), e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "File upload failed: " + e.getMessage());
        }
    }

    /** Deletes a file from Cloudinary by its public_id (extracted from URL) */
    public void delete(String publicId) {
        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
        } catch (IOException e) {
            log.warn("Failed to delete Cloudinary file {}: {}", publicId, e.getMessage());
        }
    }
}
