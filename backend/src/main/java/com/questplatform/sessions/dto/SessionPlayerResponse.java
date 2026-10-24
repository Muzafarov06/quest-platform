package com.questplatform.sessions.dto;

import java.time.Instant;
import java.util.UUID;

public record SessionPlayerResponse(
        UUID id,
        UUID sessionId,
        UUID userId,
        UUID guestToken,
        String displayName,
        String avatarUrl,
        float posX,
        float posY,
        String facing,
        UUID currentLocationId,
        Instant joinedAt,
        Instant lastSeenAt,
        boolean active,
        boolean ready
) {
}