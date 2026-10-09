package com.questplatform.sessions.event;

import com.questplatform.sessions.domain.BoardItemType;

import java.time.Instant;
import java.util.UUID;

/**
 * Событие: карточка добавлена на доску.
 * Слушается после коммита транзакции.
 */
public record BoardItemAddedEvent(
        UUID itemId,
        UUID sessionId,
        String title,
        String content,
        BoardItemType itemType,
        UUID evidenceId,
        float posX,
        float posY,
        Instant createdAt,
        Instant updatedAt,
        String playerName
) {
}