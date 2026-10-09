package com.questplatform.sessions.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "session_discovered_evidence")
@Getter
@Setter
@NoArgsConstructor
public class SessionDiscoveredEvidence {

    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "session_id", nullable = false, updatable = false)
    private UUID sessionId;

    @Column(name = "evidence_id", nullable = false, updatable = false)
    private UUID evidenceId;

    @Column(name = "discovered_by", nullable = false, updatable = false)
    private UUID discoveredBy;

    @Column(name = "discovered_at", nullable = false, updatable = false)
    private Instant discoveredAt;

    @PrePersist
    void onCreate() {
        if (discoveredAt == null) discoveredAt = Instant.now();
    }
}