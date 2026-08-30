package com.loanguard.backend.security;

import com.loanguard.backend.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {

    private final SecretKey secretKey;
    private final long expiration;

    public JwtService(
            @Value("${security.jwt.secret}") String secret,
            @Value("${security.jwt.expiration}") long expiration) {

        if (secret == null || secret.length() < 32) {
            throw new IllegalArgumentException(
                    "JWT secret must be at least 32 characters long."
            );
        }

        this.secretKey = Keys.hmacShaKeyFor(
                secret.getBytes(StandardCharsets.UTF_8)
        );

        this.expiration = expiration;
    }

    // =========================================================
    // GENERATE JWT
    // =========================================================

    public String generateToken(User user) {

        Date now = new Date();

        Date expiry = new Date(
                now.getTime() + expiration
        );

        return Jwts.builder()
                .subject(user.getEmail())
                .claim("userId", user.getId())
                .claim("role", user.getRole().name())
                .issuedAt(now)
                .expiration(expiry)
                .signWith(secretKey)
                .compact();
    }

    // =========================================================
    // EXTRACT EMAIL
    // =========================================================

    public String extractEmail(String token) {

        return getClaims(token).getSubject();
    }

    // =========================================================
    // EXTRACT ROLE
    // =========================================================

    public String extractRole(String token) {

        return getClaims(token)
                .get("role", String.class);
    }

    // =========================================================
    // VALIDATE TOKEN
    // =========================================================

    public boolean isTokenValid(
            String token,
            String email) {

        try {

            Claims claims = getClaims(token);

            String tokenEmail =
                    claims.getSubject();

            Date expirationDate =
                    claims.getExpiration();

            return tokenEmail != null
                    && tokenEmail.equals(email)
                    && expirationDate != null
                    && expirationDate.after(new Date());

        } catch (Exception e) {

            return false;
        }
    }

    // =========================================================
    // READ JWT CLAIMS
    // =========================================================

    private Claims getClaims(String token) {

        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}