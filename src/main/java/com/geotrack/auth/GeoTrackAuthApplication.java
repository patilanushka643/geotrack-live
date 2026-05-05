package com.geotrack.auth;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * GeoTrack Email OTP Authentication Service
 * Spring Boot Application Entry Point
 */
@SpringBootApplication
@EnableScheduling // For scheduled cleanup of expired OTPs
public class GeoTrackAuthApplication {

	public static void main(String[] args) {
		SpringApplication.run(GeoTrackAuthApplication.class, args);
		System.out.println("🚀 GeoTrack Auth Service running on port 8080");
	}
}
