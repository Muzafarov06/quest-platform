package com.questplatform.engine.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "characters")
@Getter
@Setter
@NoArgsConstructor
public class GameCharacter {

    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "case_id", nullable = false, updatable = false)
    private UUID caseId;

    @Column(name = "location_id")
    private UUID locationId;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "biography", columnDefinition = "TEXT")
    private String biography;

    @Column(name = "portrait_media_id")
    private UUID portraitMediaId;

    @Column(name = "dialogue_media_id")
    private UUID dialogueMediaId;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;

    @Column(name = "pos_x", nullable = false)
    private float posX = 50f;

    @Column(name = "pos_y", nullable = false)
    private float posY = 50f;

    @Column(name = "scene_scale", nullable = false)
    private float sceneScale = 1f;

    @Column(name = "scene_rotation", nullable = false)
    private float sceneRotation = 0f;

    /** AUTO | ALWAYS | LOCATION_OPENED | EVIDENCE_FOUND — см. V49. */
    @Column(name = "unlock_mode", nullable = false, length = 30)
    private String unlockMode = "AUTO";

    /** UUID локации или улики, к которой привязано открытие. */
    @Column(name = "unlock_target_id")
    private UUID unlockTargetId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
        if (unlockMode == null || unlockMode.isBlank()) unlockMode = "AUTO";
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}