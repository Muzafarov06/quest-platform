package com.questplatform.admin.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

/**
 * Обновление перехода (label, sort_order, координаты зоны на сцене).
 *
 * <p>{@code posX}/{@code posY} = null — снять со сцены;
 * переход будет показан в списке переходов.</p>
 */
public record UpdateConnectionRequest(
        @Size(max = 200)
        String label,

        Integer sortOrder,

        @Min(value = 0, message = "posX в диапазоне 0–100")
        @Max(value = 100, message = "posX в диапазоне 0–100")
        Float posX,

        @Min(value = 0, message = "posY в диапазоне 0–100")
        @Max(value = 100, message = "posY в диапазоне 0–100")
        Float posY
) {
}