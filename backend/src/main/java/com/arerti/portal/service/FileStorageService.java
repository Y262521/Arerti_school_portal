package com.arerti.portal.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

/**
 * Stores uploaded resource files on the local filesystem under a configurable
 * directory. Files are saved under a UUID name so the original filename
 * (which may contain unsafe characters) is preserved only as metadata.
 */
@Service
@Slf4j
public class FileStorageService {

    private final Path root;

    public FileStorageService(@Value("${app.storage.resources-dir:./uploads/resources}") String dir) {
        this.root = Paths.get(dir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(root);
        } catch (IOException e) {
            throw new RuntimeException("Could not create resource storage directory: " + root, e);
        }
        log.info("Resource file storage directory: {}", root);
    }

    /** Saves the file under a generated UUID-based name and returns that stored name. */
    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File is required");
        }
        String original = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
        String ext = "";
        int dot = original.lastIndexOf('.');
        if (dot >= 0) ext = original.substring(dot);

        String storedName = UUID.randomUUID() + ext;
        Path target = root.resolve(storedName).normalize();
        if (!target.getParent().equals(root)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file path");
        }
        try {
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store file");
        }
        return storedName;
    }

    public Resource loadAsResource(String storedFileName) {
        try {
            Path file = root.resolve(storedFileName).normalize();
            if (!file.getParent().equals(root)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file path");
            }
            Resource resource = new UrlResource(file.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found");
            }
            return resource;
        } catch (MalformedURLException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found");
        }
    }

    public void delete(String storedFileName) {
        try {
            Path file = root.resolve(storedFileName).normalize();
            if (file.getParent().equals(root)) {
                Files.deleteIfExists(file);
            }
        } catch (IOException e) {
            log.warn("Could not delete stored file {}: {}", storedFileName, e.getMessage());
        }
    }
}
