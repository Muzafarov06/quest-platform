package com.questplatform.sessions.dto;

import java.time.Instant;
import java.util.UUID;

public record BoardConnectionResponse(
        UUID id,
        UUID sessionId,
        UUID fromItemId,
        UUID toItemId,
        String label,
        Instant createdAt
) {
}