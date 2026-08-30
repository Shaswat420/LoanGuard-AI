package com.loanguard.backend.dto;

public class LoginRequest {

    private String email;
    private String password;

    // =========================================================
    // DEFAULT CONSTRUCTOR
    // =========================================================

    public LoginRequest() {
    }

    // =========================================================
    // CONSTRUCTOR
    // =========================================================

    public LoginRequest(
            String email,
            String password) {

        this.email = email;
        this.password = password;
    }

    // =========================================================
    // GETTERS / SETTERS
    // =========================================================

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}