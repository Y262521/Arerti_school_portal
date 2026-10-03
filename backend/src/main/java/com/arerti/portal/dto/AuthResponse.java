package com.arerti.portal.dto;

import com.arerti.portal.entity.Role;

public record AuthResponse(
        String token,
        String username,
        String fullName,
        Role role
) {}
