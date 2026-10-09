package com.questplatform.locations.dto;

import java.time.Instant;
import java.util.UUID;

public record LocationConnectionResponse(
        UUID id,
        UUID caseId,
        UUID fromLocationId,
        UUID toLocationId,
        String label,
        int sortOrder,
        Float posX,
        Float posY,
        Instant createdAt,
        Instant updatedAt
) {
}