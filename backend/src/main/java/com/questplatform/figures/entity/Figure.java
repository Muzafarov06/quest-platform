package com.questplatform.figures.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "figures")
@Getter
@Setter
@NoArgsConstructor
public class Figure {

    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "code", nullable = false, unique = true, length = 30)
    private String code;

    @Column(name = "label", nullable = false, length = 100)
    private String label;

    @Column(name = "fallback_emoji", nullable = false, length = 10)
    private String fallbackEmoji = "🕵️";

    @Column(name = "media_id")
    private UUID mediaId;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
        if (fallbackEmoji == null || fallbackEmoji.isBlank()) fallbackEmoji = "🕵️";
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}