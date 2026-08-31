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

        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.userRepository = userRepository;
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

        return username -> userRepository
                .findByEmail(username.trim().toLowerCase())

                .map(user ->
                        org.springframework.security.core.userdetails.User
                                .withUsername(user.getEmail())
                                .password(user.getPassword())
                                .roles(user.getRole().name())
                                .disabled(!user.isEnabled())
                                .build()
                )

                .orElseThrow(() ->
                        new UsernameNotFoundException(
                                "User not found: " + username
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
                new DaoAuthenticationProvider(userDetailsService);

        provider.setPasswordEncoder(passwordEncoder);

        return provider;
    }


    // =========================================================
    // AUTHENTICATION MANAGER
    // =========================================================

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration
    ) throws Exception {

        return configuration.getAuthenticationManager();
    }


    // =========================================================
    // SECURITY FILTER CHAIN
    // =========================================================

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            AuthenticationProvider authenticationProvider
    ) throws Exception {

        http

                // Enable CORS
                .cors(cors ->
                        cors.configurationSource(
                                corsConfigurationSource()
                        )
                )

                // Disable CSRF for JWT API
                .csrf(csrf -> csrf.disable())

                // Stateless session for JWT
                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                // Authentication Provider
                .authenticationProvider(authenticationProvider)

                // Authorization Rules
                .authorizeHttpRequests(auth -> auth

                        // Allow CORS preflight requests
                        .requestMatchers(
                                HttpMethod.OPTIONS,
                                "/**"
                        ).permitAll()

                        // Authentication APIs
                        .requestMatchers(
                                "/api/auth/**"
                        ).permitAll()

                        // REVIEWER APIs
                        .requestMatchers(
                                "/api/reviewer/**"
                        ).hasAnyRole(
                                "ADMIN",
                                "REVIEWER"
                        )

                        // RISK APIs
                        .requestMatchers(
                                "/api/risk/**"
                        ).hasAnyRole(
                                "ADMIN",
                                "REVIEWER",
                                "ANALYST"
                        )

                        // AUDIT APIs
                        .requestMatchers(
                                "/api/audit/**"
                        ).hasAnyRole(
                                "ADMIN",
                                "REVIEWER",
                                "ANALYST"
                        )

                        // DELETE LOANS — ADMIN ONLY
                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/loans/**"
                        ).hasRole("ADMIN")

                        // GET LOANS
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/loans/**"
                        ).hasAnyRole(
                                "ADMIN",
                                "REVIEWER",
                                "ANALYST"
                        )

                        // CREATE LOANS
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/loans/**"
                        ).hasAnyRole(
                                "ADMIN",
                                "REVIEWER"
                        )

                        // UPDATE LOANS
                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/loans/**"
                        ).hasAnyRole(
                                "ADMIN",
                                "REVIEWER"
                        )

                        // Everything else requires authentication
                        .anyRequest()
                        .authenticated()
                )

                // JWT Filter
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

        /*
         * Allow your Vercel frontend
         */
        configuration.setAllowedOriginPatterns(
                List.of(

                        "https://loan-guard-ai-five.vercel.app",

                        // Other possible Vercel deployments
                        "https://*.vercel.app",

                        // Local development
                        "http://localhost:5173",
                        "http://localhost:*",
                        "http://127.0.0.1:*"
                )
        );


        configuration.setAllowedMethods(
                List.of(
                        "GET",
                        "POST",
                        "PUT",
                        "DELETE",
                        "PATCH",
                        "OPTIONS"
                )
        );


        configuration.setAllowedHeaders(
                List.of("*")
        );


        configuration.setExposedHeaders(
                List.of(
                        "Authorization"
                )
        );


        /*
         * JWT is sent using Authorization header,
         * so cookies are not required.
         */
        configuration.setAllowCredentials(false);


        configuration.setMaxAge(3600L);


        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                configuration
        );

        return source;
    }
}