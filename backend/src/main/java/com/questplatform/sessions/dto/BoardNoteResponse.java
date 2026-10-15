package com.questplatform.sessions.dto;

import java.time.Instant;

public record BoardNoteResponse(
        String text,
        String updatedByPlayerName,
        Instant updatedAt
) {
}