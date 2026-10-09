package com.questplatform.objects.entity;

import com.questplatform.objects.domain.GameObjectState;
import com.questplatform.objects.domain.GameObjectType;
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
 * Игровой объект внутри локации.
 *
 * <p>{@code posX/posY} — позиция на сцене локации (0–100%).</p>
 *
 * <p>{@code renderLayer} — слой отрисовки: -1 под остальными,
 * 0 — обычный порядок по Y, +1 — поверх всего.</p>
 *
 * <p>{@code walkable} — можно ли проходить сквозь объект
 * (мел, рисунок на стене, фото). Если false — объект непроходим.</p>
 */
@Entity
@Table(name = "game_objects")
@Getter
@Setter
@NoArgsConstructor
public class GameObject {

    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "location_id", nullable = false, updatable = false)
    private UUID locationId;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "object_type", nullable = false, length = 30)
    private GameObjectType objectType = GameObjectType.ITEM;

    @Enumerated(EnumType.STRING)
    @Column(name = "state", nullable = false, length = 30)
    private GameObjectState state = GameObjectState.CLOSED;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;

    @Column(name = "media_id")
    private UUID mediaId;

    /** X объекта на сцене (0–100%). */
    @Column(name = "pos_x", nullable = false)
    private float posX = 50f;

    /** Y объекта на сцене (0–100%). */
    @Column(name = "pos_y", nullable = false)
    private float posY = 50f;

    /** Множитель размера маркера на сцене (0.1–10.0). */
    @Column(name = "scene_scale", nullable = false)
    private float sceneScale = 1f;

    /** Угол поворота маркера на сцене, градусы (-180..180). */
    @Column(name = "scene_rotation", nullable = false)
    private float sceneRotation = 0f;

    /** Слой отрисовки: -1 под остальными, 0 по Y, +1 поверх всего. */
    @Column(name = "render_layer", nullable = false)
    private short renderLayer = 0;

    /** Игрок может проходить сквозь объект (мел, рисунок, фото). */
    @Column(name = "walkable", nullable = false)
    private boolean walkable = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
        if (objectType == null) objectType = GameObjectType.ITEM;
        if (state == null) state = GameObjectState.CLOSED;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}