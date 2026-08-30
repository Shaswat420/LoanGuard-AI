package com.loanguard.backend.service;

import com.loanguard.backend.dto.LoginRequest;
import com.loanguard.backend.dto.LoginResponse;
import com.loanguard.backend.model.User;
import com.loanguard.backend.repository.UserRepository;
import com.loanguard.backend.security.JwtService;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    // =========================================================
    // CONSTRUCTOR
    // =========================================================

    public AuthService(
            AuthenticationManager authenticationManager,
            UserRepository userRepository,
            JwtService jwtService) {

        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    // =========================================================
    // LOGIN
    // =========================================================

    public LoginResponse login(LoginRequest request) {

        // -----------------------------------------------------
        // Validate request
        // -----------------------------------------------------

        if (request == null) {
            throw new IllegalArgumentException(
                    "Login request is required."
            );
        }

        if (request.getEmail() == null ||
                request.getEmail().trim().isEmpty()) {

            throw new IllegalArgumentException(
                    "Email is required."
            );
        }

        if (request.getPassword() == null ||
                request.getPassword().isEmpty()) {

            throw new IllegalArgumentException(
                    "Password is required."
            );
        }

        // -----------------------------------------------------
        // Normalize email
        // -----------------------------------------------------

        String email = request.getEmail()
                .trim()
                .toLowerCase();

        // -----------------------------------------------------
        // Authenticate user
        // -----------------------------------------------------

        Authentication authentication =
                authenticationManager.authenticate(
                        new UsernamePasswordAuthenticationToken(
                                email,
                                request.getPassword()
                        )
                );

        // -----------------------------------------------------
        // Authentication check
        // -----------------------------------------------------

        if (authentication == null ||
                !authentication.isAuthenticated()) {

            throw new IllegalArgumentException(
                    "Invalid email or password."
            );
        }

        // -----------------------------------------------------
        // Find user
        // -----------------------------------------------------

        User user =
                userRepository
                        .findByEmail(email)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Invalid email or password."
                                )
                        );

        // -----------------------------------------------------
        // Check account status
        // -----------------------------------------------------

        if (!user.isEnabled()) {

            throw new IllegalArgumentException(
                    "User account is disabled."
            );
        }

        // -----------------------------------------------------
        // Check role
        // -----------------------------------------------------

        if (user.getRole() == null) {

            throw new IllegalArgumentException(
                    "User role is not configured."
            );
        }

        // -----------------------------------------------------
        // Generate JWT
        // -----------------------------------------------------

        String token =
                jwtService.generateToken(user);

        // -----------------------------------------------------
        // Return login response
        // -----------------------------------------------------

        return new LoginResponse(
                token,
                user.getId(),
                user.getEmail(),
                user.getRole().name()
        );
    }
}