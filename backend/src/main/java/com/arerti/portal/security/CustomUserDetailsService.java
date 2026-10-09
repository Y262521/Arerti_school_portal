package com.arerti.portal.security;

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

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        if (username == null || username.isBlank()) {
            throw new UsernameNotFoundException("Empty username");
        }
        String clean = username.trim();
        String normalized = clean.toLowerCase().replace("-", "");

        return userRepository.findByUsername(clean)
                .or(() -> userRepository.findByUsername(normalized))
                .or(() -> userRepository.findByUsername(clean.toLowerCase()))
                .or(() -> userRepository.findByUsername(clean.toUpperCase()))
                .or(() -> userRepository.findByEmail(clean))
                .or(() -> userRepository.findByEmail(clean.toLowerCase()))
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    }
}
