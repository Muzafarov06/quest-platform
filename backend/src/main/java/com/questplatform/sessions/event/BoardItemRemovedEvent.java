package com.questplatform.sessions.event;

import java.util.UUID;

/**
 * Событие: карточка удалена с доски.
 */
public record BoardItemRemovedEvent(
        UUID sessionId,
        UUID itemId
) {
}