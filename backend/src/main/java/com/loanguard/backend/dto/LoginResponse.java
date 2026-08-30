package com.loanguard.backend.dto;

public class LoginResponse {

    private String token;
    private Long userId;
    private String email;
    private String role;

    // =========================================================
    // DEFAULT CONSTRUCTOR
    // =========================================================

    public LoginResponse() {
    }

    // =========================================================
    // CONSTRUCTOR
    // =========================================================

    public LoginResponse(
            String token,
            Long userId,
            String email,
            String role) {

        this.token = token;
        this.userId = userId;
        this.email = email;
        this.role = role;
    }

    // =========================================================
    // GETTERS / SETTERS
    // =========================================================

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}