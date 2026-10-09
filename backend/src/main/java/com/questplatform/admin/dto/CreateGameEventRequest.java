package com.questplatform.admin.dto;

import com.questplatform.engine.domain.EventType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateGameEventRequest(
        @NotNull(message = "Тип события обязателен")
        EventType eventType,

        UUID targetId,

        @Size(max = 5000)
        String message,

        Boolean once,

        Integer sortOrder
) {
}