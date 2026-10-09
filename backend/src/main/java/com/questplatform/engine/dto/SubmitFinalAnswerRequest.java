package com.questplatform.engine.dto;

import jakarta.validation.constraints.NotBlank;

public record SubmitFinalAnswerRequest(
        @NotBlank(message = "Нужно выбрать вариант")
        String selectedOptionId
) {
}