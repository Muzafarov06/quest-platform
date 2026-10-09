package com.questplatform.cases.dto;

import com.questplatform.cases.domain.CaseStatus;

import java.time.Instant;
import java.util.UUID;

/**
 * Публичное представление кейса для API.
 *
 * <p>Используется и в публичном, и в админском API. Все поля — публичные
 * метаданные кейса, скрывать нечего.</p>
 */
public record CaseResponse(
        UUID id,
        String code,
        String title,
        String description,
        String genre,
        Short ageLimit,
        Short minPlayers,
        Short maxPlayers,
        Integer durationMinutes,
        Integer priceCents,
        UUID coverMediaId,
        UUID mapMediaId,
        UUID entryLocationId,
        int mapWidth,
        int mapHeight,
        CaseStatus status,
        UUID createdBy,
        Instant createdAt,
        Instant updatedAt
) {
}