package com.questplatform.engine.dto;

import com.questplatform.engine.domain.ConditionType;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record SessionActionRequest(
        @NotNull(message = "actionType обязателен")
        ConditionType actionType,

        UUID targetId
) {
}