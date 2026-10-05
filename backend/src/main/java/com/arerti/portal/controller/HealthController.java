package com.arerti.portal.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    @Value("${cloudinary.cloud-name:NOT_SET}")
    private String cloudName;

    @Value("${cloudinary.api-key:NOT_SET}")
    private String apiKey;

    @Value("${cloudinary.api-secret:NOT_SET}")
    private String apiSecret;

    @GetMapping
    public Map<String, Object> health() {
        return Map.of(
                "status", "UP",
                "service", "arerti-portal-backend",
                "time", Instant.now().toString(),
                "cloudinary_cloud_name", cloudName,
                "cloudinary_api_key_set", !apiKey.equals("NOT_SET"),
                "cloudinary_secret_set", !apiSecret.equals("NOT_SET") && !apiSecret.isBlank()
        );
    }
}
