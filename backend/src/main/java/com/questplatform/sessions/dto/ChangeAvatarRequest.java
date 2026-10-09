package com.questplatform.sessions.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ChangeAvatarRequest(
        @NotBlank(message = "avatarKey обязателен")
        @Pattern(
                regexp = "figure-\\d{2,4}",
                message = "Неверный формат кода фигурки (ожидается figure-NN…)"
        )
        String avatarKey
) {
}