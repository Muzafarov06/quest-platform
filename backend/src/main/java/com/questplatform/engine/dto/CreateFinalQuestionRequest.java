package com.questplatform.engine.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateFinalQuestionRequest(
        @NotBlank(message = "Текст вопроса обязателен")
        @Size(max = 8000)
        String questionText,

        // Оставлено для совместимости с фронтом. Свободная форма игнорирует.
        @NotEmpty(message = "Нужен хотя бы один технический вариант")
        List<OptionRequest> options,

        @NotBlank(message = "Технический ответ обязателен")
        String correctOptionId,

        @Size(max = 30000)
        String explanationText,

        List<String> revealEvidenceIds
) {
    public record OptionRequest(
            @NotBlank String id,
            @NotBlank @Size(max = 500) String text
    ) {}
}