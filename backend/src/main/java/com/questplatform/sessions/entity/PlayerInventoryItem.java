package com.questplatform.sessions.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "player_inventory")
@Getter
@Setter
@NoArgsConstructor
public class PlayerInventoryItem {

    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "session_id", nullable = false, updatable = false)
    private UUID sessionId;

    @Column(name = "player_id", nullable = false, updatable = false)
    private UUID playerId;

    @Column(name = "evidence_id", nullable = false, updatable = false)
    private UUID evidenceId;

    @Column(name = "added_at", nullable = false, updatable = false)
    private Instant addedAt;

    @PrePersist
    void onCreate() {
        if (addedAt == null) addedAt = Instant.now();
    }
}