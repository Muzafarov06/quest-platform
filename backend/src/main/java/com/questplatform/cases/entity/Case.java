package com.questplatform.cases.entity;

import com.questplatform.cases.domain.CaseStatus;
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
 * Кейс (квест) платформы.
 *
 * <p>Маппится на таблицу {@code cases}. Пока — только метаданные.
 * Контент (локации, улики, события) — в отдельных сущностях.</p>
 */
@Entity
@Table(name = "cases")
@Getter
@Setter
@NoArgsConstructor
public class Case {

    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "code", nullable = false, unique = true, length = 30)
    private String code;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "genre", nullable = false, length = 30)
    private String genre = "DETECTIVE";

    @Column(name = "age_limit", nullable = false)
    private Short ageLimit = 16;

    @Column(name = "min_players", nullable = false)
    private Short minPlayers = 1;

    @Column(name = "max_players", nullable = false)
    private Short maxPlayers = 10;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "price_cents", nullable = false)
    private Integer priceCents = 0;

    /**
     * Обложка кейса. Храним только UUID, без {@code @ManyToOne}:
     * тянем CaseMedia отдельным запросом, если нужно.
     */
    @Column(name = "cover_media_id")
    private UUID coverMediaId;

    /** Фон карты местности (PNG-схема города/леса). Может быть null. */
    @Column(name = "map_media_id")
    private UUID mapMediaId;

    /** Стартовая локация: где появляется игрок при старте сессии. */
    @Column(name = "entry_location_id")
    private UUID entryLocationId;

    /** Ширина полотна карты дела (px). */
    @Column(name = "map_width", nullable = false)
    private int mapWidth = 2400;

    /** Высота полотна карты дела (px). */
    @Column(name = "map_height", nullable = false)
    private int mapHeight = 1600;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private CaseStatus status = CaseStatus.DRAFT;

    @Column(name = "created_by", nullable = false, updatable = false)
    private UUID createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    // ---------- Callbacks ----------

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
        if (status == null) status = CaseStatus.DRAFT;
        if (genre == null || genre.isBlank()) genre = "DETECTIVE";
        if (ageLimit == null) ageLimit = 16;
        if (minPlayers == null) minPlayers = 1;
        if (maxPlayers == null) maxPlayers = 10;
        if (priceCents == null) priceCents = 0;
        if (mapWidth == 0) mapWidth = 2400;
        if (mapHeight == 0) mapHeight = 1600;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}