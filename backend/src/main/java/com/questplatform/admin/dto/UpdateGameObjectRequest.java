package com.questplatform.admin.dto;

import com.questplatform.objects.domain.GameObjectState;
import com.questplatform.objects.domain.GameObjectType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record UpdateGameObjectRequest(
        @NotBlank(message = "Название обязательно")
        @Size(max = 200)
        String name,

        @Size(max = 5000)
        String description,

        @NotNull(message = "Тип обязателен")
        GameObjectType objectType,

        @NotNull(message = "Состояние обязательно")
        GameObjectState state,

        UUID mediaId,
        @NotNull Integer sortOrder,

        @Min(value = 0, message = "posX в диапазоне 0–100")
        @Max(value = 100, message = "posX в диапазоне 0–100")
        Float posX,

        @Min(value = 0, message = "posY в диапазоне 0–100")
        @Max(value = 100, message = "posY в диапазоне 0–100")
        Float posY,

        @Min(value = 0, message = "sceneScale в диапазоне 0.1–10")
        @Max(value = 10, message = "sceneScale в диапазоне 0.1–10")
        Float sceneScale,

        @Min(value = -180, message = "sceneRotation в диапазоне -180…180")
        @Max(value = 180, message = "sceneRotation в диапазоне -180…180")
        Float sceneRotation,

        @Min(-1) @Max(1)
        Short renderLayer,

        Boolean walkable
) {
}