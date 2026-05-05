package com.geotrack.auth.dto;

/**
 * Request DTO for sending OTP
 */
public class SendOTPRequest {
    private String email;
    private String type; // "signup" or "login"

    public SendOTPRequest() {}

    public SendOTPRequest(String email, String type) {
        this.email = email;
        this.type = type;
    }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
}
