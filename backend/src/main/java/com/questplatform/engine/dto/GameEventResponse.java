package com.questplatform.engine.dto;

import com.questplatform.engine.domain.EventType;

import java.util.UUID;

/**
 * Публичное представление игрового события.
 */
public record GameEventResponse(
        UUID id,
        UUID caseId,
        UUID conditionId,
        EventType eventType,
        UUID targetId,
        String message,
        boolean once,
        int sortOrder
) {
}