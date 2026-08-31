package com.loanguard.backend.config;

import java.util.Arrays;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.http.HttpMethod;

import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;

import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;

import org.springframework.security.config.http.SessionCreationPolicy;

import org.springframework.security.web.SecurityFilterChain;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;


@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {

        http

            // Disable CSRF because this is a REST API using JWT/token authentication
            .csrf(csrf -> csrf.disable())

            // Enable CORS
            .cors(Customizer.withDefaults())

            // Stateless API
            .sessionManagement(session ->
                    session.sessionCreationPolicy(
                            SessionCreationPolicy.STATELESS
                    )
            )

            // Authorization rules
            .authorizeHttpRequests(auth -> auth

                    // Allow browser preflight requests
                    .requestMatchers(HttpMethod.OPTIONS, "/**")
                    .permitAll()

                    // Allow authentication endpoints
                    .requestMatchers("/api/auth/**")
                    .permitAll()

                    // Allow health checks
                    .requestMatchers(
                            "/",
                            "/health",
                            "/actuator/**"
                    )
                    .permitAll()

                    /*
                     * TEMPORARILY allow Loan API.
                     *
                     * This ensures your frontend can access
                     * /api/loans without Spring Security blocking it.
                     */
                    .requestMatchers("/api/loans/**")
                    .permitAll()

                    // Allow other API endpoints for now
                    .requestMatchers("/api/**")
                    .permitAll()

                    // Everything else requires authentication
                    .anyRequest()
                    .authenticated()
            );

        return http.build();
    }


    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration =
                new CorsConfiguration();

        /*
         * Your Vercel Frontend URLs
         */
        configuration.setAllowedOrigins(Arrays.asList(

                "https://loan-guard-ai-five.vercel.app",

                "https://loan-guard-ai.vercel.app",

                "http://localhost:5173",

                "http://localhost:3000"
        ));


        /*
         * Allowed HTTP Methods
         */
        configuration.setAllowedMethods(Arrays.asList(

                "GET",

                "POST",

                "PUT",

                "DELETE",

                "PATCH",

                "OPTIONS"
        ));


        /*
         * Allowed Headers
         */
        configuration.setAllowedHeaders(Arrays.asList(

                "Authorization",

                "Content-Type",

                "Accept",

                "Origin",

                "X-Requested-With"
        ));


        /*
         * Headers exposed to frontend
         */
        configuration.setExposedHeaders(Arrays.asList(

                "Authorization"
        ));


        /*
         * JWT authentication may require credentials.
         */
        configuration.setAllowCredentials(true);


        /*
         * Apply CORS configuration to every endpoint.
         */
        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(

                "/**",

                configuration
        );

        return source;
    }
}