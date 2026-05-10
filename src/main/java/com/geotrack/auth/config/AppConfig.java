package com.geotrack.auth.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.Scheduled;
import com.geotrack.auth.service.OTPService;
import org.springframework.beans.factory.annotation.Autowired;

/**
 * Application Configuration - Setup scheduled tasks
 */
@Configuration
public class AppConfig {

    @Autowired
    private OTPService otpService;

    /**
     * Cleanup expired OTPs every 5 minutes
     */
    @Scheduled(fixedRate = 300000) // 5 minutes
    public void cleanupExpiredOTPs() {
        System.out.println("🧹 Cleaning up expired OTPs...");
        otpService.cleanupExpiredOTPs();
    }
}
