package com.questplatform.engine.dto;

import java.util.List;

/**
 * Результат обработки действия в сессии.
 */
public record SessionActionResponse(
        List<GameEventResponse> triggeredEvents
) {
}