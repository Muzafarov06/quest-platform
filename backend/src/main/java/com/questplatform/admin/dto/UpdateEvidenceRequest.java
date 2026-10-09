package com.questplatform.admin.dto;

import com.questplatform.evidences.domain.EvidenceImportance;
import com.questplatform.evidences.domain.EvidenceType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

/**
 * Полный апдейт улики. {@code objectId}/{@code locationId}/{@code mediaId} = null — очистить.
 */
public record UpdateEvidenceRequest(
        @NotBlank(message = "Название обязательно")
        @Size(max = 200)
        String title,

        @Size(max = 5000)
        String description,

        @Size(max = 10000)
        String contentText,

        @NotNull(message = "Тип улики обязателен")
        EvidenceType evidenceType,

        @NotNull(message = "Важность обязательна")
        EvidenceImportance importance,

        UUID objectId,
        UUID locationId,
        UUID mediaId,
        @NotNull Integer sortOrder
) {
}