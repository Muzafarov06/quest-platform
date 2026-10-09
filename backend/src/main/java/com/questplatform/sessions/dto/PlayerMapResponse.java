package com.questplatform.sessions.dto;

import java.util.List;
import java.util.UUID;

/**
 * Карта дела для игрока.
 *
 * Отдаём все локации, включая закрытые. Закрытые помечены
 * {@code unlocked=false} — фронт рисует их серыми и не пускает внутрь.
 * Открытые совпадают с {@code session_unlocked_locations}.
 */
public record PlayerMapResponse(
        UUID caseId,
        String caseCode,
        String caseTitle,
        UUID mapMediaId,
        int mapWidth,
        int mapHeight,
        UUID entryLocationId,
        List<PlayerMapLocation> locations
) {
    public record PlayerMapLocation(
            UUID id,
            String name,
            String locationType,
            UUID mediaId,
            UUID previewMediaId,
            UUID mapMediaId,
            int mapX,
            int mapY,
            float sceneScale,
            float sceneRotation,
            boolean unlocked,
            boolean isEntry
    ) {}
}