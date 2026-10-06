package com.arerti.portal.dto;

import com.arerti.portal.entity.User;

public record UserLookupResponse(
        Long id,
        String username,
        String email,
        String fullName,
        String role,
        boolean enabled
) {
    public static UserLookupResponse from(User u) {
        return new UserLookupResponse(
                u.getId(), u.getUsername(), u.getEmail(),
                u.getFullName(), u.getRole().name(), u.isEnabled()
        );
    }
}
