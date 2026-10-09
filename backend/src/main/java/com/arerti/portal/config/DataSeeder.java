package com.arerti.portal.config;

import com.arerti.portal.entity.Role;
import com.arerti.portal.entity.User;
import com.arerti.portal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * On first boot, create a default ADMIN so the operator can log in
 * and bootstrap the rest of the data.
 *
 * Credentials can be overridden via env vars:
 *   SEED_ADMIN_USERNAME  (default: admin)
 *   SEED_ADMIN_PASSWORD  (default: Admin@12345)
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        String username = System.getenv().getOrDefault("SEED_ADMIN_USERNAME", "admin");
        String password = System.getenv().getOrDefault("SEED_ADMIN_PASSWORD", "Admin@12345");

        if (!userRepository.existsByUsername(username)) {
            User admin = User.builder()
                    .username(username)
                    .email(username + "@arerti.edu.et")
                    .password(passwordEncoder.encode(password))
                    .fullName("System Administrator")
                    .role(Role.ADMIN)
                    .enabled(true)
                    .mustChangePassword(true)
                    .build();
            userRepository.save(admin);

            log.info("=================================================================");
            log.info("  Seeded default ADMIN -> username: '{}'  password: '{}'", username, password);
            log.info("  CHANGE THIS PASSWORD ON FIRST LOGIN.");
            log.info("=================================================================");
        }

        if (!userRepository.existsByUsername("parent")) {
            User parent = User.builder()
                    .username("parent")
                    .email("parent@arerti.edu.et")
                    .password(passwordEncoder.encode("Parent@12345"))
                    .fullName("Abebe Bekele (Parent)")
                    .phone("0911223344")
                    .role(Role.PARENT)
                    .enabled(true)
                    .mustChangePassword(false)
                    .build();
            userRepository.save(parent);
            log.info("  Seeded default PARENT -> username: 'parent'  password: 'Parent@12345'");
        }
    }
}
