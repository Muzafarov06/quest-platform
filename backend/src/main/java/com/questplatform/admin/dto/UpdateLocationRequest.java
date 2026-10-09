package com.questplatform.admin.dto;

import com.questplatform.locations.domain.DiscoveryMode;
import com.questplatform.locations.domain.LocationType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record UpdateLocationRequest(
        @NotBlank(message = "Название обязательно")
        @Size(max = 200)
        String name,

        @Size(max = 5000)
        String description,

        @NotNull(message = "Тип локации обязателен")
        LocationType locationType,

        UUID parentId,
        UUID mediaId,
        UUID previewMediaId,
        UUID mapMediaId,
        @NotNull Integer sortOrder,

        @Min(value = 0, message = "entryX в диапазоне 0–100")
        @Max(value = 100, message = "entryX в диапазоне 0–100")
        Float entryX,

        @Min(value = 0, message = "entryY в диапазоне 0–100")
        @Max(value = 100, message = "entryY в диапазоне 0–100")
        Float entryY,

        DiscoveryMode discoveryMode,
        UUID discoveryTargetId,
        @Size(max = 5000)
        String discoveryHint,

        @Min(value = 0, message = "sceneScale в диапазоне 0.1–10")
        @Max(value = 10, message = "sceneScale в диапазоне 0.1–10")
        Float sceneScale,

        @Min(value = -180, message = "sceneRotation в диапазоне -180…180")
        @Max(value = 180, message = "sceneRotation в диапазоне -180…180")
        Float sceneRotation
) {
}