package com.questplatform.sessions.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * Локация, открытая в конкретной сессии.
 *
 * <p>Возникает когда: сессия стартует (для ALWAYS-локаций) или
 * срабатывает триггер (улика/локация/диалог/manual).</p>
 *
 * <p>Уникально по паре {@code (session_id, location_id)} —
 * повторное открытие идемпотентно.</p>
 */
@Entity
@Table(name = "session_unlocked_locations")
@Getter
@Setter
@NoArgsConstructor
public class SessionUnlockedLocation {

    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "session_id", nullable = false, updatable = false)
    private UUID sessionId;

    @Column(name = "location_id", nullable = false, updatable = false)
    private UUID locationId;

    @Column(name = "unlocked_at", nullable = false, updatable = false)
    private Instant unlockedAt;

    @Column(name = "unlocked_by")
    private UUID unlockedBy;

    @PrePersist
    void onCreate() {
        if (unlockedAt == null) unlockedAt = Instant.now();
    }
}