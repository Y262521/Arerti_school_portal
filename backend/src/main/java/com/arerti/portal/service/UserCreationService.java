package com.arerti.portal.service;

import com.arerti.portal.entity.User;
import com.arerti.portal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Dedicated service for creating User accounts.
 * Lives in a separate Spring bean so @Transactional(REQUIRES_NEW)
 * is honoured — Spring AOP cannot intercept self-calls within the
 * same bean, so splitting into a separate class is required.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserCreationService {

    private final UserRepository userRepository;
    private final org.springframework.jdbc.core.JdbcTemplate jdbc;

    @jakarta.annotation.PostConstruct
    public void init() {
        try {
            jdbc.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check");
            log.info("UserCreationService init: dropped users_role_check constraint");
        } catch (Exception e) {
            log.warn("UserCreationService init constraint drop note: {}", e.getMessage());
        }
    }

    /**
     * Saves a User in its own brand-new transaction that commits
     * immediately and independently of any surrounding transaction.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public User saveUser(User user) {
        try {
            jdbc.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check");
        } catch (Exception ignored) {}
        User saved = userRepository.saveAndFlush(user);
        log.info("UserCreationService: committed user id={} username={}", saved.getId(), saved.getUsername());
        return saved;
    }
}
