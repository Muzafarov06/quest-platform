package com.questplatform.media.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * Ответ с медиа-файлом. Включает presigned URL для скачивания.
 */
public record MediaResponse(
        UUID id,
        UUID caseId,
        String originalName,
        String mimeType,
        long sizeBytes,
        Integer width,
        Integer height,
        String url,
        Instant createdAt
) {
}