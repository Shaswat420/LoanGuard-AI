package com.loanguard.backend.config;

import com.loanguard.backend.model.User;
import com.loanguard.backend.model.UserRole;
import com.loanguard.backend.repository.UserRepository;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initializeUsers(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {

        return args -> {

            // =====================================================
            // ADMIN
            // =====================================================

            createUserIfNotExists(
                    userRepository,
                    passwordEncoder,
                    "admin@loanguard.com",
                    "Admin@123",
                    UserRole.ADMIN
            );

            // =====================================================
            // REVIEWER
            // =====================================================

            createUserIfNotExists(
                    userRepository,
                    passwordEncoder,
                    "reviewer@loanguard.com",
                    "Reviewer@123",
                    UserRole.REVIEWER
            );

            // =====================================================
            // ANALYST
            // =====================================================

            createUserIfNotExists(
                    userRepository,
                    passwordEncoder,
                    "analyst@loanguard.com",
                    "Analyst@123",
                    UserRole.ANALYST
            );

            // =====================================================
            // COMPLETE
            // =====================================================

            System.out.println(
                    "================================================="
            );

            System.out.println(
                    "LoanGuard user initialization completed."
            );

            System.out.println(
                    "Existing users were not modified."
            );

            System.out.println(
                    "================================================="
            );
        };
    }

    // =========================================================
    // CREATE USER ONLY IF MISSING
    // =========================================================

    private void createUserIfNotExists(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            String email,
            String password,
            UserRole role
    ) {

        String normalizedEmail =
                email.trim().toLowerCase();

        // -----------------------------------------------------
        // Check whether user already exists
        // -----------------------------------------------------

        if (userRepository.existsByEmail(
                normalizedEmail
        )) {

            System.out.println(
                    "User already exists: "
                            + normalizedEmail
            );

            return;
        }

        // -----------------------------------------------------
        // Create new user
        // -----------------------------------------------------

        User user = new User();

        user.setEmail(
                normalizedEmail
        );

        user.setPassword(
                passwordEncoder.encode(password)
        );

        user.setRole(role);

        user.setEnabled(true);

        userRepository.save(user);

        System.out.println(
                "Created user: "
                        + normalizedEmail
                        + " ["
                        + role
                        + "]"
        );
    }
}