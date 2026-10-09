package com.questplatform.locations.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * Переход между локациями.
 *
 * <p>{@code posX/posY} — координата кликабельной зоны перехода на сцене
 * (0–100%). {@code null} означает, что переход показывается списком,
 * а не на сцене.</p>
 */
@Entity
@Table(name = "location_connections")
@Getter
@Setter
@NoArgsConstructor
public class LocationConnection {

    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "case_id", nullable = false, updatable = false)
    private UUID caseId;

    @Column(name = "from_location_id", nullable = false, updatable = false)
    private UUID fromLocationId;

    @Column(name = "to_location_id", nullable = false, updatable = false)
    private UUID toLocationId;

    @Column(name = "label", length = 200)
    private String label;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;

    /** X зоны перехода на сцене (0–100%). {@code null} = не показывать на сцене. */
    @Column(name = "pos_x")
    private Float posX;

    /** Y зоны перехода на сцене (0–100%). {@code null} = не показывать на сцене. */
    @Column(name = "pos_y")
    private Float posY;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}