package com.arerti.portal.service;

import com.mongodb.client.gridfs.model.GridFSFile;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.gridfs.GridFsOperations;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.UUID;

/**
 * Stores uploaded resource files in MongoDB GridFS.
 * This ensures files survive Render redeploys (no local filesystem dependency).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FileStorageService {

    private final GridFsTemplate gridFsTemplate;
    private final GridFsOperations gridFsOperations;

    /**
     * Stores the file in GridFS and returns the GridFS ObjectId as the stored name.
     */
    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File is required");
        }
        try {
            String original = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
            String contentType = file.getContentType() != null ? file.getContentType() : "application/octet-stream";
            ObjectId id = gridFsTemplate.store(file.getInputStream(), original, contentType);
            log.info("Stored file '{}' in GridFS with id {}", original, id);
            return id.toHexString();
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store file");
        }
    }

    public Resource loadAsResource(String storedFileId) {
        try {
            GridFSFile gridFSFile = gridFsTemplate.findOne(
                    new Query(Criteria.where("_id").is(new ObjectId(storedFileId))));
            if (gridFSFile == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found");
            }
            return new InputStreamResource(gridFsOperations.getResource(gridFSFile).getInputStream());
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found");
        }
    }

    public void delete(String storedFileId) {
        try {
            gridFsTemplate.delete(new Query(Criteria.where("_id").is(new ObjectId(storedFileId))));
            log.info("Deleted file {} from GridFS", storedFileId);
        } catch (Exception e) {
            log.warn("Could not delete GridFS file {}: {}", storedFileId, e.getMessage());
        }
    }
}
