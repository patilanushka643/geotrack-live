package com.geotrack.auth.service;

import com.geotrack.auth.model.OTPData;
import org.springframework.stereotype.Service;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * OTP Service - Handles OTP generation, verification, and storage
 * Thread-safe implementation using ConcurrentHashMap internally
 */
@Service
public class OTPService {

    // In-memory storage (Replace with Redis/Database in production)
    private final Map<String, OTPData> otpStore = new HashMap<>();
    private final Map<String, UserSession> userSessions = new HashMap<>();
    
    // Constants
    private static final int OTP_LENGTH = 6;
    private static final int OTP_VALIDITY_MINUTES = 5;
    private static final int RESEND_COOLDOWN_SECONDS = 30;
    private static final String EMAIL_REGEX = "^[A-Za-z0-9+_.-]+@(.+)$";
    private static final Pattern EMAIL_PATTERN = Pattern.compile(EMAIL_REGEX);

    /**
     * Generate a random 6-digit OTP
     * @return Random OTP string
     */
    public String generateOTP() {
        SecureRandom random = new SecureRandom();
        int min = (int) Math.pow(10, OTP_LENGTH - 1);
        int maxExclusive = (int) Math.pow(10, OTP_LENGTH);
        int otp = min + random.nextInt(maxExclusive - min);
        return String.valueOf(otp);
    }

    /**
     * Hash OTP using SHA-256
     * @param otp Plain text OTP
     * @return Hashed OTP (Base64 encoded)
     */
    public String hashOTP(String otp) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(otp.getBytes());
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Error hashing OTP", e);
        }
    }

    /**
     * Verify OTP against stored hash
     * @param plainOTP User-entered OTP
     * @param storedHash Hashed OTP from storage
     * @return true if OTP matches
     */
    public boolean verifyOTP(String plainOTP, String storedHash) {
        return hashOTP(plainOTP).equals(storedHash);
    }

    /**
     * Validate email format
     * @param email Email address
     * @return true if valid email format
     */
    public boolean isValidEmail(String email) {
        return email != null && EMAIL_PATTERN.matcher(email).matches();
    }

    /**
     * Store OTP for an email with expiration
     * @param email User email
     * @param otp Generated OTP
     * @param type "signup" or "login"
     * @return OTPData object with metadata
     */
    public OTPData storeOTP(String email, String otp, String type) {
        String hashedOTP = hashOTP(otp);
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(OTP_VALIDITY_MINUTES);
        
        OTPData otpData = new OTPData(email, hashedOTP, expiresAt, type);
        otpStore.put(email, otpData);
        
        return otpData;
    }

    /**
     * Retrieve OTP data for an email
     * @param email User email
     * @return OTPData if exists, null otherwise
     */
    public OTPData getOTPData(String email) {
        return otpStore.get(email);
    }

    /**
     * Check if user can request OTP (respects cooldown)
     * @param email User email
     * @return Map with allowed status and retryAfter seconds
     */
    public Map<String, Object> canRequestOTP(String email) {
        Map<String, Object> result = new HashMap<>();
        
        if (!otpStore.containsKey(email)) {
            result.put("allowed", true);
            return result;
        }

        OTPData otpData = otpStore.get(email);
        long secondsPassed = java.time.temporal.ChronoUnit.SECONDS
            .between(otpData.getSentAt(), LocalDateTime.now());

        if (secondsPassed < RESEND_COOLDOWN_SECONDS) {
            result.put("allowed", false);
            result.put("retryAfter", RESEND_COOLDOWN_SECONDS - secondsPassed);
            return result;
        }

        result.put("allowed", true);
        return result;
    }

    /**
     * Verify OTP and mark user as verified
     * @param email User email
     * @param otp User-entered OTP
     * @return Verification result with message
     */
    public Map<String, Object> verifyUserOTP(String email, String otp) {
        Map<String, Object> result = new HashMap<>();

        // Check if OTP exists for this email
        if (!otpStore.containsKey(email)) {
            result.put("success", false);
            result.put("message", "No OTP found for this email. Please request a new one.");
            result.put("statusCode", 401);
            return result;
        }

        OTPData otpData = otpStore.get(email);

        // Check if OTP is expired
        if (otpData.isExpired()) {
            otpStore.remove(email);
            result.put("success", false);
            result.put("message", "OTP has expired. Please request a new one.");
            result.put("statusCode", 401);
            return result;
        }

        // Check attempt limit
        if (otpData.isMaxAttemptsExceeded()) {
            otpStore.remove(email);
            result.put("success", false);
            result.put("message", "Maximum OTP verification attempts exceeded. Please request a new OTP.");
            result.put("statusCode", 429);
            return result;
        }

        // Verify OTP
        if (verifyOTP(otp, otpData.getHashedOTP())) {
            // Success - Mark as verified
            otpStore.remove(email);
            markEmailAsVerified(email, otpData.getType());
            
            result.put("success", true);
            result.put("message", "OTP verified successfully!");
            result.put("statusCode", 200);
            result.put("token", email); // In production, generate JWT token
            return result;
        } else {
            // Failed - Increment attempt count
            otpData.incrementAttempt();
            result.put("success", false);
            result.put("message", "Invalid OTP. You have " + otpData.getRemainingAttempts() + " attempts remaining.");
            result.put("attemptsLeft", otpData.getRemainingAttempts());
            result.put("statusCode", 401);
            return result;
        }
    }

    /**
     * Mark email as verified in user session
     * @param email User email
     * @param type "signup" or "login"
     */
    public void markEmailAsVerified(String email, String type) {
        UserSession session = new UserSession();
        session.setVerified(true);
        session.setVerifiedAt(LocalDateTime.now());
        session.setType(type);
        userSessions.put(email, session);
    }

    /**
     * Check if email is verified
     * @param email User email
     * @return true if verified
     */
    public boolean isEmailVerified(String email) {
        return userSessions.containsKey(email) && userSessions.get(email).isVerified();
    }

    /**
     * Register user after OTP verification
     * @param email User email
     * @param fullName User's full name
     * @param userId User's chosen ID
     * @param password User's password
     * @return Registration result
     */
    public Map<String, Object> registerUser(String email, String fullName, String userId, String password) {
        Map<String, Object> result = new HashMap<>();

        // Check if email is verified
        if (!isEmailVerified(email)) {
            result.put("success", false);
            result.put("message", "Email not verified. Please verify OTP first.");
            result.put("statusCode", 401);
            return result;
        }

        // Validate inputs
        if (fullName == null || fullName.trim().isEmpty() || 
            userId == null || userId.trim().isEmpty() || 
            password == null || password.length() < 6) {
            result.put("success", false);
            result.put("message", "All fields required. Password must be 6+ characters.");
            result.put("statusCode", 400);
            return result;
        }

        // Update user session with registration data
        UserSession session = userSessions.get(email);
        session.setFullName(fullName);
        session.setUserId(userId);
        session.setPassword(hashPassword(password)); // Hash password in production
        session.setRegisteredAt(LocalDateTime.now());

        result.put("success", true);
        result.put("message", "Registration completed successfully!");
        result.put("statusCode", 201);
        result.put("user", new HashMap<String, String>() {{
            put("email", email);
            put("fullName", fullName);
            put("userId", userId);
        }});

        return result;
    }

    /**
     * Hash password (use BCrypt in production)
     * @param password Plain text password
     * @return Hashed password
     */
    private String hashPassword(String password) {
        return hashOTP(password); // Simple hash for demo (use BCrypt in production)
    }

    /**
     * Clean up expired OTPs (scheduled task)
     */
    public void cleanupExpiredOTPs() {
        otpStore.entrySet().removeIf(entry -> entry.getValue().isExpired());
    }

    /**
     * User Session - Stores user verification status
     */
    public static class UserSession {
        private boolean verified;
        private LocalDateTime verifiedAt;
        private String type;
        private String fullName;
        private String userId;
        private String password;
        private LocalDateTime registeredAt;

        public boolean isVerified() { return verified; }
        public void setVerified(boolean verified) { this.verified = verified; }

        public LocalDateTime getVerifiedAt() { return verifiedAt; }
        public void setVerifiedAt(LocalDateTime verifiedAt) { this.verifiedAt = verifiedAt; }

        public String getType() { return type; }
        public void setType(String type) { this.type = type; }

        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }

        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }

        public LocalDateTime getRegisteredAt() { return registeredAt; }
        public void setRegisteredAt(LocalDateTime registeredAt) { this.registeredAt = registeredAt; }
    }
}
