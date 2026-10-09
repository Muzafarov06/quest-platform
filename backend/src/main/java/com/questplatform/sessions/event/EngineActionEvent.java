package com.questplatform.sessions.event;

import com.questplatform.engine.domain.ConditionType;

import java.util.UUID;

/**
 * Действие игрока в сессии, которое должно быть обработано движком
 * и механизмом открытия локаций.
 *
 * <p>Публикуется ВНУТРИ транзакции действия (осмотр объекта, находка
 * улики), но обрабатывается ПОСЛЕ её коммита — в отдельной транзакции.
 * Так ошибка движка не откатит сам факт находки улики или осмотра.</p>
 */
public record EngineActionEvent(
        UUID sessionId,
        UUID playerId,
        ConditionType conditionType,
        UUID targetId
) {
}