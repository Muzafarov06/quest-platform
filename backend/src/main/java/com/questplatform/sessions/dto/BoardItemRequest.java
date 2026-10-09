package com.questplatform.sessions.dto;

import com.questplatform.sessions.domain.BoardItemType;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record BoardItemRequest(
        @NotNull(message = "itemType обязателен")
        BoardItemType itemType,

        String title,
        String content,

        UUID evidenceId,

        Float posX,
        Float posY
) {
}