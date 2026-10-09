package com.questplatform.admin.dto;

import com.questplatform.engine.domain.ConditionType;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record UpdateConditionRequest(
        @NotNull(message = "Тип условия обязателен")
        ConditionType conditionType,

        UUID targetId
) {
}