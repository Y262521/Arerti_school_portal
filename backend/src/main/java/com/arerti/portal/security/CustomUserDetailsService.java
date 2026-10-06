package com.arerti.portal.security;

import com.arerti.portal.repository.StudentRepository;
import com.arerti.portal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // 1. Try by username
        // 2. Try by email
        // 3. Try by Student UID (e.g. STU-2026-XXXXXX) — resolves to the student's user account
        return userRepository.findByUsername(username)
                .or(() -> userRepository.findByEmail(username))
                .or(() -> studentRepository.findByStudentUid(username.toUpperCase())
                        .map(s -> s.getUser()))
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    }
}
