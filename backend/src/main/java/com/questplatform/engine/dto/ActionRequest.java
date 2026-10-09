package com.questplatform.engine.dto;

import com.questplatform.engine.domain.ConditionType;

import java.util.UUID;

/**
 * Запрос на действие игрока.
 *
 * <p>Frontend сообщает: «игрок сделал X с объектом Y».</p>
 */
public record ActionRequest(
        ConditionType actionType,
        UUID targetId
) {
}