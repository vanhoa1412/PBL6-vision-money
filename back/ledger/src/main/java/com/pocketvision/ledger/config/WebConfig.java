package com.pocketvision.ledger.config;

import org.springframework.beans.factory.annotation.Value; // Import này thiếu
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays; // Import này thiếu
import java.util.List;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${application.security.cors.allowed-origins}")
    private String allowedOrigins; // Đọc danh sách domain cho phép từ config

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Tách chuỗi thành list (ví dụ: "http://a.com,http://b.com")
        configuration.setAllowedOrigins(Arrays.asList(allowedOrigins.split(",")));
        
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        configuration.setAllowCredentials(true);
        configuration.setExposedHeaders(List.of("Authorization"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}