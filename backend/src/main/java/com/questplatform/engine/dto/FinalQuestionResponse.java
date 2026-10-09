package com.questplatform.engine.dto;

import java.util.List;
import java.util.UUID;

/**
 * Вопрос для игрока. БЕЗ правильного ответа и БЕЗ объяснения.
 * Игрок видит только текст вопроса и варианты.
 */
public record FinalQuestionResponse(
        UUID id,
        String questionText,
        List<Option> options
) {
    public record Option(String id, String text) {}
}