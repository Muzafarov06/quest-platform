package com.questplatform.admin.dto;

import java.util.UUID;

/**
 * Информация о кейсе перед удалением: что у него внутри и есть ли
 * блокирующие зависимости.
 */
public record CaseDeleteInfo(
        UUID caseId,
        String caseCode,
        String caseTitle,
        String caseStatus,
        long locations,
        long evidences,
        long characters,
        long sessions
) {
}