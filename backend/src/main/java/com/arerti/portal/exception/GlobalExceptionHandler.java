package com.arerti.portal.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleStatus(ResponseStatusException ex) {
        return body(ex.getStatusCode().value(), ex.getReason());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getFieldErrors()
          .forEach(e -> fieldErrors.put(e.getField(), e.getDefaultMessage()));
        Map<String, Object> b = baseBody(HttpStatus.BAD_REQUEST.value(), "Please check the form fields.");
        b.put("errors", fieldErrors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(b);
    }

    /**
     * Catches database constraint violations (duplicate keys, FK violations, etc.)
     * and returns a clean, user-friendly message instead of the raw SQL error.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrity(DataIntegrityViolationException ex) {
        log.warn("Data integrity violation: {}", ex.getMostSpecificCause().getMessage());

        String message = "This record already exists or conflicts with existing data.";

        // Provide context-specific messages based on table/constraint hints
        String cause = ex.getMostSpecificCause().getMessage();
        if (cause != null) {
            if (cause.contains("grade_sections")) {
                message = "A class with this grade, section, and stream already exists for this academic year.";
            } else if (cause.contains("students") || cause.contains("student_uid")) {
                message = "A student with this information already exists.";
            } else if (cause.contains("teachers") || cause.contains("employee_id")) {
                message = "A teacher with this information already exists.";
            } else if (cause.contains("users") || cause.contains("username") || cause.contains("email")) {
                message = "An account with this username or email already exists.";
            }
        }

        return body(HttpStatus.CONFLICT.value(), message);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleDenied(AccessDeniedException ex) {
        return body(HttpStatus.FORBIDDEN.value(), "You do not have permission to perform this action.");
    }

    /**
     * Catch-all — logs the full error internally but never exposes raw technical
     * details to the user.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleAll(Exception ex) {
        log.error("Unhandled exception: {}", ex.getMessage(), ex);
        return body(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "An unexpected error occurred. Please try again.");
    }

    private ResponseEntity<Map<String, Object>> body(int status, String message) {
        return ResponseEntity.status(status).body(baseBody(status, message));
    }

    private Map<String, Object> baseBody(int status, String message) {
        Map<String, Object> body = new HashMap<>();
        body.put("status", status);
        body.put("message", message);
        body.put("timestamp", Instant.now().toString());
        return body;
    }
}
