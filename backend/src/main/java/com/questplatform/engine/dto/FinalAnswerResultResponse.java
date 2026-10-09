package com.questplatform.engine.dto;

import java.util.List;
import java.util.UUID;

/**
 * Результат финального ответа. Возвращается команде после отправки.
 */
public record FinalAnswerResultResponse(
        UUID questionId,
        String questionText,
        String correctOptionId,
        String correctOptionText,
        String selectedOptionId,
        String selectedOptionText,
        boolean isCorrect,
        String explanationText,
        List<EvidenceBrief> revealedEvidences
) {
    public record EvidenceBrief(UUID id, String title, String contentText) {}
}