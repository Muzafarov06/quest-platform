package com.questplatform.admin.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Обновление позиции карточки локации на карте дела.
 * Только координаты — не трогает остальные поля локации.
 */
public record UpdateMapPositionRequest(
        @NotNull(message = "mapX обязателен")
        @Min(value = 0, message = "mapX >= 0")
        Integer mapX,

        @NotNull(message = "mapY обязателен")
        @Min(value = 0, message = "mapY >= 0")
        Integer mapY
) {
}