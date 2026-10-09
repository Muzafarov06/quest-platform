package com.questplatform.objects.dto;

import com.questplatform.objects.domain.GameObjectState;
import com.questplatform.objects.domain.GameObjectType;

import java.time.Instant;
import java.util.UUID;

public record GameObjectResponse(
        UUID id,
        UUID locationId,
        UUID mediaId,
        String name,
        String description,
        GameObjectType objectType,
        GameObjectState state,
        int sortOrder,
        float posX,
        float posY,
        float sceneScale,
        float sceneRotation,
        short renderLayer,
        boolean walkable,
        Instant createdAt,
        Instant updatedAt
) {
}