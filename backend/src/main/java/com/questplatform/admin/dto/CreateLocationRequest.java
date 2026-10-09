package com.questplatform.admin.dto;

import com.questplatform.locations.domain.DiscoveryMode;
import com.questplatform.locations.domain.LocationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateLocationRequest(
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
        Integer sortOrder,

        DiscoveryMode discoveryMode,
        UUID discoveryTargetId,
        @Size(max = 5000)
        String discoveryHint
) {
}