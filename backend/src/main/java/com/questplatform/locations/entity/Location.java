package com.questplatform.locations.entity;

import com.questplatform.locations.domain.DiscoveryMode;
import com.questplatform.locations.domain.LocationType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
 * Локация внутри кейса.
 *
 * <p>Иерархия через {@code parentId}: дом → этаж → комната.</p>
 *
 * <p>{@code entryX/entryY} — точка входа игрока на сцене локации (0–100%).</p>
 *
 * <p>{@code discoveryMode} — как локация открывается игрокам.
 * По умолчанию {@code ALWAYS} — доступна с начала сессии.</p>
 */
@Entity
@Table(name = "locations")
@Getter
@Setter
@NoArgsConstructor
public class Location {

    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "case_id", nullable = false, updatable = false)
    private UUID caseId;

    @Column(name = "parent_id")
    private UUID parentId;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "location_type", nullable = false, length = 30)
    private LocationType locationType = LocationType.ROOM;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;

    /** Фон сцены локации (что видит игрок, войдя внутрь). */
    @Column(name = "media_id")
    private UUID mediaId;

    /** Превью для карты дела (что видно в предпросмотре на карте). */
    @Column(name = "preview_media_id")
    private UUID previewMediaId;

    /** PNG-спрайт локации на карте дела. */
    @Column(name = "map_media_id")
    private UUID mapMediaId;

    /** X точки входа игрока на сцене (0–100%). */
    @Column(name = "entry_x", nullable = false)
    private float entryX = 50f;

    /** Y точки входа игрока на сцене (0–100%). */
    @Column(name = "entry_y", nullable = false)
    private float entryY = 85f;

    @Column(name = "scene_scale", nullable = false)
    private float sceneScale = 1f;

    @Column(name = "scene_rotation", nullable = false)
    private float sceneRotation = 0f;

    /** Как локация становится доступной игрокам. */
    @Enumerated(EnumType.STRING)
    @Column(name = "discovery_mode", nullable = false, length = 20)
    private DiscoveryMode discoveryMode = DiscoveryMode.ALWAYS;

    /** X карточки на карте дела (пиксели). */
    @Column(name = "map_x", nullable = false)
    private int mapX = 60;

    /** Y карточки на карте дела (пиксели). */
    @Column(name = "map_y", nullable = false)
    private int mapY = 60;

    /** UUID цели-триггера (улики/персонажа/локации). */
    @Column(name = "discovery_target_id")
    private UUID discoveryTargetId;

    /** Текст-подсказка в момент открытия. */
    @Column(name = "discovery_hint", columnDefinition = "TEXT")
    private String discoveryHint;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
        if (locationType == null) locationType = LocationType.ROOM;
        if (discoveryMode == null) discoveryMode = DiscoveryMode.ALWAYS;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}