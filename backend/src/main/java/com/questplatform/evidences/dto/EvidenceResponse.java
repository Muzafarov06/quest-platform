package com.questplatform.evidences.dto;

import com.questplatform.evidences.domain.EvidenceImportance;
import com.questplatform.evidences.domain.EvidenceType;

import java.time.Instant;
import java.util.UUID;

public record EvidenceResponse(
        UUID id,
        UUID caseId,
        UUID objectId,
        UUID locationId,
        UUID mediaId,        // ← новое
        String objectName,
        String locationName,
        String title,
        String description,
        String contentText,
        EvidenceType evidenceType,
        EvidenceImportance importance,
        int sortOrder,
        Instant createdAt,
        Instant updatedAt
) {
}