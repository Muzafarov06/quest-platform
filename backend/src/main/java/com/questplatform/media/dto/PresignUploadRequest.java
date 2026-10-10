package com.questplatform.media.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record PresignUploadRequest(
        UUID caseId,           // может быть null для глобального медиа
        @NotBlank String originalName,
        @NotBlank String contentType,
        @NotNull Long sizeBytes
) {
}