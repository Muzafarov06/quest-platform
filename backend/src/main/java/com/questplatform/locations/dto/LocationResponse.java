package com.questplatform.locations.dto;

import com.questplatform.locations.domain.DiscoveryMode;
import com.questplatform.locations.domain.LocationType;

import java.time.Instant;
import java.util.UUID;

public record LocationResponse(
        UUID id,
        UUID caseId,
        UUID parentId,
        UUID mediaId,
        UUID previewMediaId,
        UUID mapMediaId,
        String name,
        String description,
        LocationType locationType,
        int sortOrder,
        float entryX,
        float entryY,
        DiscoveryMode discoveryMode,
        UUID discoveryTargetId,
        String discoveryHint,
        int mapX,
        int mapY,
        float sceneScale,
        float sceneRotation,
        Instant createdAt,
        Instant updatedAt
) {
}