package com.arerti.portal.repository;

import com.arerti.portal.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);

    @Query("SELECT u FROM User u WHERE LOWER(u.username) = LOWER(:identifier) " +
           "OR LOWER(REPLACE(u.username, '-', '')) = LOWER(:normalized) " +
           "OR LOWER(u.email) = LOWER(:identifier)")
    Optional<User> findByIdentifier(@Param("identifier") String identifier, @Param("normalized") String normalized);
}
