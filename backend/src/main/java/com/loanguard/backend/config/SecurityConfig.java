package com.loanguard.backend.config;

import com.loanguard.backend.repository.UserRepository;
import com.loanguard.backend.security.JwtAuthenticationFilter;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.http.HttpMethod;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;

import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

import org.springframework.security.config.annotation.web.builders.HttpSecurity;

import org.springframework.security.config.http.SessionCreationPolicy;

import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final UserRepository userRepository;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter,
            UserRepository userRepository) {

        this.jwtAuthenticationFilter =
                jwtAuthenticationFilter;

        this.userRepository =
                userRepository;
    }

    // =========================================================
    // PASSWORD ENCODER
    // =========================================================

    @Bean
    public PasswordEncoder passwordEncoder() {

        return new BCryptPasswordEncoder();
    }

    // =========================================================
    // USER DETAILS SERVICE
    // =========================================================

    @Bean
    public UserDetailsService userDetailsService() {

        return username ->
                userRepository
                        .findByEmail(
                                username.trim().toLowerCase()
                        )
                        .map(user ->
                                org.springframework.security.core.userdetails.User
                                        .withUsername(
                                                user.getEmail()
                                        )
                                        .password(
                                                user.getPassword()
                                        )
                                        .roles(
                                                user.getRole().name()
                                        )
                                        .disabled(
                                                !user.isEnabled()
                                        )
                                        .build()
                        )
                        .orElseThrow(() ->
                                new UsernameNotFoundException(
                                        "User not found."
                                )
                        );
    }

    // =========================================================
    // AUTHENTICATION PROVIDER
    // =========================================================

    @Bean
    public AuthenticationProvider authenticationProvider(
            UserDetailsService userDetailsService,
            PasswordEncoder passwordEncoder) {

        DaoAuthenticationProvider provider =
                new DaoAuthenticationProvider(
                        userDetailsService
                );

        provider.setPasswordEncoder(
                passwordEncoder
        );

        return provider;
    }

    // =========================================================
    // AUTHENTICATION MANAGER
    // =========================================================

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration)
            throws Exception {

        return configuration.getAuthenticationManager();
    }

    // =========================================================
    // SECURITY FILTER CHAIN
    // =========================================================

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            AuthenticationProvider authenticationProvider)
            throws Exception {

        http

                // =================================================
                // CORS
                // =================================================

                .cors(cors ->
                        cors.configurationSource(
                                corsConfigurationSource()
                        )
                )

                // =================================================
                // CSRF
                // =================================================

                .csrf(csrf ->
                        csrf.disable()
                )

                // =================================================
                // STATELESS JWT SESSION
                // =================================================

                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                // =================================================
                // AUTH PROVIDER
                // =================================================

                .authenticationProvider(
                        authenticationProvider
                )

                // =================================================
                // AUTHORIZATION
                // =================================================

                .authorizeHttpRequests(auth -> auth

                        // -----------------------------------------
                        // LOGIN / AUTH
                        // -----------------------------------------

                        .requestMatchers(
                                "/api/auth/**"
                        ).permitAll()

                        // -----------------------------------------
                        // CORS PREFLIGHT
                        // -----------------------------------------

                        .requestMatchers(
                                HttpMethod.OPTIONS,
                                "/**"
                        ).permitAll()

                        // -----------------------------------------
                        // REVIEWER
                        // -----------------------------------------

                        .requestMatchers(
                                "/api/reviewer/**"
                        ).hasAnyRole(
                                "ADMIN",
                                "REVIEWER"
                        )

                        // -----------------------------------------
                        // RISK
                        // -----------------------------------------

                        .requestMatchers(
                                "/api/risk/**"
                        ).hasAnyRole(
                                "ADMIN",
                                "REVIEWER",
                                "ANALYST"
                        )

                        // -----------------------------------------
                        // AUDIT
                        // -----------------------------------------

                        .requestMatchers(
                                "/api/audit/**"
                        ).hasAnyRole(
                                "ADMIN",
                                "REVIEWER",
                                "ANALYST"
                        )

                        // -----------------------------------------
                        // LOAN DELETE
                        // ADMIN ONLY
                        // -----------------------------------------

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/loans/**"
                        ).hasRole("ADMIN")

                        // -----------------------------------------
                        // LOAN READ
                        // -----------------------------------------

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/loans/**"
                        ).hasAnyRole(
                                "ADMIN",
                                "REVIEWER",
                                "ANALYST"
                        )

                        // -----------------------------------------
                        // LOAN CREATE / UPDATE / VALIDATE
                        // -----------------------------------------

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/loans/**"
                        ).hasAnyRole(
                                "ADMIN",
                                "REVIEWER"
                        )

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/loans/**"
                        ).hasAnyRole(
                                "ADMIN",
                                "REVIEWER"
                        )

                        // -----------------------------------------
                        // EVERYTHING ELSE
                        // -----------------------------------------

                        .anyRequest()
                        .authenticated()
                )

                // =================================================
                // JWT FILTER
                // =================================================

                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    // =========================================================
    // CORS CONFIGURATION
    // =========================================================

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration =
                new CorsConfiguration();

        configuration.setAllowedOrigins(
                List.of(
                        "http://localhost:5173"
                )
        );

        configuration.setAllowedMethods(
                List.of(
                        "GET",
                        "POST",
                        "PUT",
                        "DELETE",
                        "OPTIONS"
                )
        );

        configuration.setAllowedHeaders(
                List.of(
                        "Authorization",
                        "Content-Type",
                        "Accept"
                )
        );

        configuration.setExposedHeaders(
                List.of(
                        "Authorization"
                )
        );

        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                configuration
        );

        return source;
    }
}