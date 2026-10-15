package com.questplatform.sessions.event;

import java.util.UUID;

/** Событие: карточка на доске перемещена. */
public record BoardItemMovedEvent(
        UUID sessionId,
        UUID itemId,
        float posX,
        float posY,
        String playerName
) {
}