package com.questplatform.sessions.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Результат осмотра объекта игроком.
 *
 * <p>Возвращает сам объект + все его улики с состоянием:
 * кто и когда забрал, есть ли у меня в Портфеле.</p>
 */
public record ObjectInspectResponse(
        UUID objectId,
        String objectName,
        String objectDescription,
        String objectType,
        String objectState,
        UUID objectMediaId,
        List<InspectEvidenceItem> evidences
) {
    public record InspectEvidenceItem(
            UUID evidenceId,
            String title,
            String description,
            String contentText,
            String evidenceType,
            String importance,
            UUID mediaId,
            UUID discoveredByPlayerId,
            String discoveredByPlayerName,
            Instant discoveredAt,
            boolean inMyInventory
    ) {}
}