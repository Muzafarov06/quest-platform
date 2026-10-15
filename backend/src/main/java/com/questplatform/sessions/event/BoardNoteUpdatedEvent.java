package com.questplatform.sessions.event;

import java.time.Instant;
import java.util.UUID;

/** Событие: обновлена общая заметка доски. */
public record BoardNoteUpdatedEvent(
        UUID sessionId,
        String text,
        String updatedByPlayerName,
        Instant updatedAt
) {
}