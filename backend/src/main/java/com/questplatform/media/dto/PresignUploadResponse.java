package com.questplatform.media.dto;

import java.util.UUID;

public record PresignUploadResponse(
        UUID mediaId,
        String uploadUrl,   // presigned PUT URL — браузер шлёт сюда file
        String s3Key
) {
}