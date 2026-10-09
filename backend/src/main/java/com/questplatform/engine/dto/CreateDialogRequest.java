package com.questplatform.engine.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateDialogRequest(
        @NotBlank(message = "Вопрос обязателен")
        @Size(max = 2000)
        String question,

        @NotBlank(message = "Ответ обязателен")
        @Size(max = 10000)
        String answer,

        UUID requiresEvidenceId,
        Integer sortOrder
) {
}