package com.pocketvision.ledger.model;

import com.fasterxml.jackson.annotation.JsonProperty; // [1] Import cái này
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String title; 

    @Column(nullable = false)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type = NotificationType.GENERAL;

    @JsonProperty("isRead") 
    @Column(name = "is_read")
    private boolean isRead = false;

    @Column(name = "related_id")
    private Long relatedId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum NotificationType {
        BUDGET_WARNING, NEW_INVOICE, PAYMENT_REMINDER, GENERAL
    }
}