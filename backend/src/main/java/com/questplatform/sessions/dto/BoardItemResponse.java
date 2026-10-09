package com.questplatform.sessions.dto;

import com.questplatform.sessions.domain.BoardItemType;

import java.time.Instant;
import java.util.UUID;

public record BoardItemResponse(
        UUID id,
        UUID sessionId,
        UUID createdBy,
        String createdByName,
        BoardItemType itemType,
        String title,
        String content,
        UUID evidenceId,
        float posX,
        float posY,
        Instant createdAt,
        Instant updatedAt
) {
}