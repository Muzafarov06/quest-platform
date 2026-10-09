package com.questplatform.admin.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

/**
 * Универсальный PATCH для изменения позиции/масштаба/поворота маркера.
 *
 * Позиция трактуется по-разному в разных контекстах:
 *   • на сцене локации — проценты (0..100);
 *   • на карте дела — пиксели (map_x, map_y).
 * Поэтому диапазон posX/posY широкий: −100000..100000.
 *
 * Точную валидацию (clamp) делает сервис — там уже известен контекст.
 */
public record TransformRequest(
        @Min(-100_000) @Max(100_000) Float posX,
        @Min(-100_000) @Max(100_000) Float posY,
        @Min(0) @Max(10) Float scale,
        @Min(-180) @Max(180) Float rotation
) {
}