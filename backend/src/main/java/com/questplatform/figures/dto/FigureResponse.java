package com.questplatform.figures.dto;

import java.time.Instant;
import java.util.UUID;

public record FigureResponse(
        UUID id,
        String code,
        String label,
        String fallbackEmoji,
        UUID mediaId,
        int sortOrder,
        boolean active,
        Instant createdAt
) {
}