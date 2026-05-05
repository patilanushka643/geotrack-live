package com.geotrack.auth.model;

import java.time.LocalDateTime;

/**
 * OTP Data Model - Stores OTP details with expiration
 */
public class OTPData {
    private String email;
    private String hashedOTP;
    private LocalDateTime expiresAt;
    private int attemptCount;
    private int maxAttempts;
    private String type; // "signup" or "login"
    private LocalDateTime sentAt;

    public OTPData(String email, String hashedOTP, LocalDateTime expiresAt, String type) {
        this.email = email;
        this.hashedOTP = hashedOTP;
        this.expiresAt = expiresAt;
        this.type = type;
        this.sentAt = LocalDateTime.now();
        this.attemptCount = 0;
        this.maxAttempts = 5;
    }

    // Getters and Setters
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getHashedOTP() { return hashedOTP; }
    public void setHashedOTP(String hashedOTP) { this.hashedOTP = hashedOTP; }

    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }

    public int getAttemptCount() { return attemptCount; }
    public void incrementAttempt() { this.attemptCount++; }

    public int getMaxAttempts() { return maxAttempts; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public LocalDateTime getSentAt() { return sentAt; }
    public void setSentAt(LocalDateTime sentAt) { this.sentAt = sentAt; }

    /**
     * Check if OTP is expired
     */
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }

    /**
     * Check if max attempts exceeded
     */
    public boolean isMaxAttemptsExceeded() {
        return attemptCount >= maxAttempts;
    }

    /**
     * Get remaining attempts
     */
    public int getRemainingAttempts() {
        return maxAttempts - attemptCount;
    }
}
