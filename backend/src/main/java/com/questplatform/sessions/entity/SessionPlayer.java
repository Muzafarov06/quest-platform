package com.questplatform.sessions.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "session_players")
@Getter
@Setter
@NoArgsConstructor
public class SessionPlayer {

    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "session_id", nullable = false, updatable = false)
    private UUID sessionId;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "guest_token")
    private UUID guestToken;

    @Column(name = "display_name", nullable = false, length = 50)
    private String displayName;

    @Column(name = "avatar_key", nullable = false, length = 50)
    private String avatarKey = "default";

    @Column(name = "pos_x", nullable = false)
    private float posX = 50f;

    @Column(name = "pos_y", nullable = false)
    private float posY = 50f;

    @Column(name = "facing", nullable = false, length = 10)
    private String facing = "DOWN";

    /** Локация, где игрок сейчас. NULL — на карте дела. */
    @Column(name = "current_location_id")
    private UUID currentLocationId;

    @Column(name = "joined_at", nullable = false, updatable = false)
    private Instant joinedAt;

    @Column(name = "last_seen_at")
    private Instant lastSeenAt;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "is_ready", nullable = false)
    private boolean ready = false;

    @PrePersist
    void onCreate() {
        if (joinedAt == null) joinedAt = Instant.now();
        if (avatarKey == null || avatarKey.isBlank()) avatarKey = "default";
    }
}