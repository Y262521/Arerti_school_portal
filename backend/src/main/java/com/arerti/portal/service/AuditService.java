package com.arerti.portal.service;

import com.arerti.portal.dto.AuditLogResponse;
import com.arerti.portal.entity.AuditLog;
import com.arerti.portal.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

/**
 * Best-effort audit trail writer. Logging a failure here must never break
 * the calling operation, so every write is swallowed + logged on error.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public void log(String actorUsername, String actorRole, String action,
                     String entityType, String entityId, String details) {
        try {
            auditLogRepository.save(AuditLog.builder()
                    .actorUsername(actorUsername)
                    .actorRole(actorRole)
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .details(details)
                    .build());
        } catch (Exception e) {
            log.warn("Failed to write audit log [{} {} {}]: {}", action, entityType, entityId, e.getMessage());
        }
    }

    public Page<AuditLogResponse> findAll(Pageable pageable) {
        return auditLogRepository.findAllByOrderByCreatedAtDesc(pageable).map(AuditLogResponse::from);
    }

    public Page<AuditLogResponse> findByEntityType(String entityType, Pageable pageable) {
        return auditLogRepository.findByEntityTypeOrderByCreatedAtDesc(entityType, pageable).map(AuditLogResponse::from);
    }
}
