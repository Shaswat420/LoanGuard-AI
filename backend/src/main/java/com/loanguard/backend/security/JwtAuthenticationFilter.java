package com.loanguard.backend.security;

import com.loanguard.backend.model.User;
import com.loanguard.backend.repository.UserRepository;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(
            JwtService jwtService,
            UserRepository userRepository) {

        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        String authorizationHeader =
                request.getHeader("Authorization");

        // =====================================================
        // NO AUTHORIZATION HEADER
        // =====================================================

        if (authorizationHeader == null ||
                authorizationHeader.isBlank()) {

            filterChain.doFilter(request, response);
            return;
        }

        // =====================================================
        // INVALID AUTHORIZATION HEADER
        // =====================================================

        if (!authorizationHeader.startsWith("Bearer ")) {

            filterChain.doFilter(request, response);
            return;
        }

        String token =
                authorizationHeader.substring(7).trim();

        if (token.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        try {

            // =================================================
            // EXTRACT EMAIL FROM JWT
            // =================================================

            String email =
                    jwtService.extractEmail(token);

            if (email == null || email.isBlank()) {
                filterChain.doFilter(request, response);
                return;
            }

            // =================================================
            // DON'T OVERWRITE EXISTING AUTHENTICATION
            // =================================================

            if (SecurityContextHolder
                    .getContext()
                    .getAuthentication() != null) {

                filterChain.doFilter(request, response);
                return;
            }

            // =================================================
            // FIND USER
            // =================================================

            User user =
                    userRepository
                            .findByEmail(
                                    email.trim().toLowerCase()
                            )
                            .orElse(null);

            if (user == null) {

                System.out.println(
                        "JWT authentication failed: user not found: "
                                + email
                );

                filterChain.doFilter(request, response);
                return;
            }

            // =================================================
            // CHECK USER ENABLED
            // =================================================

            if (!user.isEnabled()) {

                System.out.println(
                        "JWT authentication failed: user disabled: "
                                + email
                );

                filterChain.doFilter(request, response);
                return;
            }

            // =================================================
            // VALIDATE JWT
            // =================================================

            boolean valid =
                    jwtService.isTokenValid(
                            token,
                            user.getEmail()
                    );

            if (!valid) {

                System.out.println(
                        "JWT authentication failed: invalid token for "
                                + email
                );

                filterChain.doFilter(request, response);
                return;
            }

            // =================================================
            // GET USER ROLE
            // =================================================

            String role =
                    user.getRole().name();

            // =================================================
            // CREATE SPRING AUTHENTICATION
            // =================================================

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            user.getEmail(),
                            null,
                            List.of(
                                    new SimpleGrantedAuthority(
                                            "ROLE_" + role
                                    )
                            )
                    );

            // =================================================
            // STORE AUTHENTICATION
            // =================================================

            SecurityContextHolder
                    .getContext()
                    .setAuthentication(authentication);

            System.out.println(
                    "JWT authentication successful: "
                            + email
                            + " [ROLE_"
                            + role
                            + "]"
            );

        } catch (Exception e) {

            System.out.println(
                    "JWT authentication error: "
                            + e.getClass().getSimpleName()
                            + " - "
                            + e.getMessage()
            );

            SecurityContextHolder
                    .clearContext();
        }

        // =====================================================
        // CONTINUE REQUEST
        // =====================================================

        filterChain.doFilter(request, response);
    }
}