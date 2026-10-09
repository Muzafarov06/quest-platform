package com.questplatform.engine.dto;

import java.util.List;

/**
 * Результат обработки действия: сработавшие события.
 */
public record ActionResponse(
        List<GameEventResponse> triggeredEvents
) {
}