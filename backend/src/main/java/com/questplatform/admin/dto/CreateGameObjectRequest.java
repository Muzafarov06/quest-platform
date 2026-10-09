package com.questplatform.admin.dto;

import com.questplatform.objects.domain.GameObjectState;
import com.questplatform.objects.domain.GameObjectType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateGameObjectRequest(
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
        Integer sortOrder,

        @Min(-1) @Max(1)
        Short renderLayer,

        Boolean walkable
) {
}