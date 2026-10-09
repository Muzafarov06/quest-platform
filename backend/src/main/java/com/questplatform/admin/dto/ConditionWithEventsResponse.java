package com.questplatform.admin.dto;

import com.questplatform.engine.domain.ConditionType;
import com.questplatform.engine.dto.GameEventResponse;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Условие вместе со своими событиями.
 * Один запрос на весь список — не N+1.
 */
public record ConditionWithEventsResponse(
        UUID id,
        UUID caseId,
        ConditionType conditionType,
        UUID targetId,
        Instant createdAt,
        List<GameEventResponse> events
) {
}