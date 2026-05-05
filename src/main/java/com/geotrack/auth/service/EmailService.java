package com.geotrack.auth.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import javax.mail.internet.MimeMessage;

/**
 * Email Service - Sends OTP emails using JavaMailSender
 */
@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.name:GeoTrack}")
    private String appName;

    /**
     * Send OTP email with HTML template
     * @param toEmail Recipient email
     * @param otp One-Time Password
     * @return true if email sent successfully
     */
    public boolean sendOTPEmail(String toEmail, String otp) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "utf-8");

            String htmlContent = buildOTPEmailHTML(otp);

            helper.setTo(toEmail);
            helper.setFrom(fromEmail);
            helper.setSubject("🔐 " + appName + " - Email Verification OTP");
            helper.setText(htmlContent, true); // true = HTML

            mailSender.send(message);
            System.out.println("✅ OTP email sent successfully to: " + toEmail);
            return true;

        } catch (Exception e) {
            System.err.println("❌ Error sending OTP email: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    /**
     * Build HTML email template for OTP
     * @param otp One-Time Password
     * @return HTML email content
     */
    private String buildOTPEmailHTML(String otp) {
        return "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "  <meta charset='utf-8'>" +
                "  <style>" +
                "    body { font-family: Arial, sans-serif; background: #0f172a; }" +
                "    .container { background: #1e293b; color: #ffffff; padding: 30px; border-radius: 10px; max-width: 500px; margin: 20px auto; }" +
                "    h2 { color: #3b82f6; margin-bottom: 20px; }" +
                "    .otp-box { background: #0f172a; padding: 25px; border-radius: 8px; text-align: center; margin: 20px 0; }" +
                "    .otp-code { font-size: 36px; letter-spacing: 8px; font-weight: bold; color: #10b981; font-family: monospace; }" +
                "    .timer { color: #94a3b8; font-size: 14px; margin-top: 15px; }" +
                "    .warning { color: #ef4444; font-size: 12px; margin-top: 15px; }" +
                "    .footer { border-top: 1px solid #334155; margin-top: 20px; padding-top: 15px; font-size: 12px; color: #475569; text-align: center; }" +
                "  </style>" +
                "</head>" +
                "<body>" +
                "  <div class='container'>" +
                "    <h2>📍 " + appName + " - Email Verification</h2>" +
                "    <p>Your One-Time Password (OTP) for email verification is:</p>" +
                "    <div class='otp-box'>" +
                "      <div class='otp-code'>" + otp + "</div>" +
                "    </div>" +
                "    <div class='timer'>⏱️ This OTP is valid for <strong>5 minutes</strong> only.</div>" +
                "    <div class='warning'>🔒 Never share this OTP with anyone. We will never ask for it.</div>" +
                "    <div class='footer'>" +
                "      <p>If you didn't request this email, please ignore it.</p>" +
                "      <p>© 2026 " + appName + ". All rights reserved.</p>" +
                "    </div>" +
                "  </div>" +
                "</body>" +
                "</html>";
    }

    /**
     * Send welcome email after registration
     * @param email User email
     * @param fullName User's full name
     * @return true if email sent successfully
     */
    public boolean sendWelcomeEmail(String email, String fullName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "utf-8");

            String htmlContent = "<!DOCTYPE html>" +
                    "<html><body style='font-family: Arial; background: #0f172a; color: #ffffff;'>" +
                    "<div style='background: #1e293b; padding: 30px; border-radius: 10px; max-width: 500px; margin: 20px auto;'>" +
                    "<h2 style='color: #10b981;'>✅ Welcome to " + appName + "!</h2>" +
                    "<p>Hi <strong>" + fullName + "</strong>,</p>" +
                    "<p>Your account has been created successfully. You can now log in and start using " + appName + ".</p>" +
                    "<p style='color: #94a3b8; font-size: 12px; margin-top: 30px;'>© 2026 " + appName + ". All rights reserved.</p>" +
                    "</div></body></html>";

            helper.setTo(email);
            helper.setFrom(fromEmail);
            helper.setSubject("✅ Welcome to " + appName + "!");
            helper.setText(htmlContent, true);

            mailSender.send(message);
            return true;

        } catch (Exception e) {
            System.err.println("❌ Error sending welcome email: " + e.getMessage());
            return false;
        }
    }
}
