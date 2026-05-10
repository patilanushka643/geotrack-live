package com.geotrack.auth.controller;

import com.geotrack.auth.dto.ApiResponse;
import com.geotrack.auth.dto.SendOTPRequest;
import com.geotrack.auth.dto.VerifyOTPRequest;
import com.geotrack.auth.dto.RegisterRequest;
import com.geotrack.auth.service.OTPService;
import com.geotrack.auth.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Authentication REST API Controller
 * Endpoints: /api/auth/send-otp, /api/auth/verify-otp, /api/auth/register
 */
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*", maxAge = 3600) // Enable CORS for frontend
public class AuthController {

    @Autowired
    private OTPService otpService;

    @Autowired
    private EmailService emailService;

    /**
     * POST /api/auth/send-otp
     * Send OTP to user's email
     * Request: { "email": "user@example.com", "type": "signup" }
     */
    @PostMapping("/send-otp")
    public ResponseEntity<ApiResponse<?>> sendOTP(@RequestBody SendOTPRequest request) {
        try {
            String email = request.getEmail().trim();
            String type = request.getType();

            // Validate email format
            if (!otpService.isValidEmail(email)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ApiResponse<>(false, "❌ Invalid email format"));
            }

            // Check if user can request OTP (cooldown check)
            Map<String, Object> canRequest = otpService.canRequestOTP(email);
            if (!(boolean) canRequest.get("allowed")) {
                long retryAfter = (long) canRequest.get("retryAfter");
                Map<String, Object> data = new HashMap<>();
                data.put("retryAfter", retryAfter);
                return ResponseEntity.status(429)
                        .body(new ApiResponse<>(false, 
                            "⏱️ Please wait " + retryAfter + " seconds before requesting a new OTP", 
                            data, 429));
            }

            // Generate OTP
            String otp = otpService.generateOTP();
            otpService.storeOTP(email, otp, type);

            // Send OTP via email
            boolean emailSent = emailService.sendOTPEmail(email, otp);

            if (emailSent) {
                Map<String, Object> data = new HashMap<>();
                data.put("expiresIn", 300); // 5 minutes in seconds
                
                return ResponseEntity.ok(new ApiResponse<>(true, 
                    "✅ OTP sent successfully to " + email, 
                    data, 200));
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(new ApiResponse<>(false, "❌ Failed to send OTP. Please try again."));
            }

        } catch (Exception e) {
            System.err.println("Error in send-otp: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "❌ Server error: " + e.getMessage()));
        }
    }

    /**
     * POST /api/auth/verify-otp
     * Verify OTP entered by user
     * Request: { "email": "user@example.com", "otp": "123456" }
     */
    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<?>> verifyOTP(@RequestBody VerifyOTPRequest request) {
        try {
            String email = request.getEmail().trim();
            String otp = request.getOtp().trim();

            // Validate inputs
            if (email.isEmpty() || otp.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ApiResponse<>(false, "❌ Email and OTP are required"));
            }

            // Verify OTP
            Map<String, Object> result = otpService.verifyUserOTP(email, otp);

            int statusCode = (int) result.get("statusCode");
            boolean success = (boolean) result.get("success");
            String message = (String) result.get("message");

            HttpStatus httpStatus = HttpStatus.valueOf(statusCode);
            
            return ResponseEntity.status(httpStatus)
                    .body(new ApiResponse<>(success, message, result, statusCode));

        } catch (Exception e) {
            System.err.println("Error in verify-otp: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "❌ Server error: " + e.getMessage()));
        }
    }

    /**
     * POST /api/auth/register
     * Complete registration after OTP verification
     * Request: { "email": "user@example.com", "fullName": "John Doe", "userId": "johndoe", "password": "pass123" }
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<?>> register(@RequestBody RegisterRequest request) {
        try {
            String email = request.getEmail().trim();
            String fullName = request.getFullName();
            String userId = request.getUserId();
            String password = request.getPassword();

            // Register user
            Map<String, Object> result = otpService.registerUser(email, fullName, userId, password);

            int statusCode = (int) result.get("statusCode");
            boolean success = (boolean) result.get("success");
            String message = (String) result.get("message");

            // Send welcome email if registration successful
            if (success) {
                emailService.sendWelcomeEmail(email, fullName);
            }

            HttpStatus httpStatus = HttpStatus.valueOf(statusCode);
            
            return ResponseEntity.status(httpStatus)
                    .body(new ApiResponse<>(success, message, result.get("user"), statusCode));

        } catch (Exception e) {
            System.err.println("Error in register: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "❌ Server error: " + e.getMessage()));
        }
    }

    /**
     * GET /api/auth/check-session/:email
     * Check if email is verified
     */
    @GetMapping("/check-session/{email}")
    public ResponseEntity<ApiResponse<?>> checkSession(@PathVariable String email) {
        try {
            boolean verified = otpService.isEmailVerified(email.trim());
            
            Map<String, Object> data = new HashMap<>();
            data.put("verified", verified);

            return ResponseEntity.ok(new ApiResponse<>(true, 
                "Session check completed", 
                data, 200));

        } catch (Exception e) {
            System.err.println("Error in check-session: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "❌ Server error"));
        }
    }

    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "✅ Service is running");
        response.put("timestamp", java.time.LocalDateTime.now().toString());
        return ResponseEntity.ok(response);
    }
}
