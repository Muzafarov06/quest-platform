package com.questplatform.engine.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdateFinalQuestionRequest(
        @NotBlank(message = "Текст вопроса обязателен")
        @Size(max = 8000)
        String questionText,

        @NotEmpty(message = "Нужен хотя бы один технический вариант")
        List<CreateFinalQuestionRequest.OptionRequest> options,

        @NotBlank(message = "Технический ответ обязателен")
        String correctOptionId,

        @Size(max = 30000)
        String explanationText,

        List<String> revealEvidenceIds
) {
}