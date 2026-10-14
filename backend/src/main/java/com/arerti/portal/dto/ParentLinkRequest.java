package com.arerti.portal.dto;

import jakarta.validation.constraints.NotBlank;

public record ParentLinkRequest(
        @NotBlank String studentUsername,
        @NotBlank String studentPassword,
        String relationship
) {}
