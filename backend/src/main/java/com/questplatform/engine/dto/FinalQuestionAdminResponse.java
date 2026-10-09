package com.questplatform.engine.dto;

import java.util.List;
import java.util.UUID;

/**
 * Вопрос для админа. Со всеми полями.
 */
public record FinalQuestionAdminResponse(
        UUID id,
        UUID caseId,
        String questionText,
        List<Option> options,
        String correctOptionId,
        String explanationText,
        List<String> revealEvidenceIds
) {
    public record Option(String id, String text) {}
}