package com.questplatform.sessions.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "board_connections")
@Getter
@Setter
@NoArgsConstructor
public class BoardConnection {

    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "session_id", nullable = false, updatable = false)
    private UUID sessionId;

    @Column(name = "from_item_id", nullable = false, updatable = false)
    private UUID fromItemId;

    @Column(name = "to_item_id", nullable = false, updatable = false)
    private UUID toItemId;

    @Column(name = "label", length = 100)
    private String label;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
    }
}