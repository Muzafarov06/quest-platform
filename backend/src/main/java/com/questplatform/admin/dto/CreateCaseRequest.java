package com.questplatform.admin.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Запрос на создание кейса (только метаданные).
 *
 * <p>Контент (локации, улики) создаётся отдельными endpoint'ами.</p>
 */
public record CreateCaseRequest(

        @NotBlank(message = "Код кейса обязателен")
        @Size(max = 30, message = "Код не должен превышать 30 символов")
        @Pattern(regexp = "^[A-Z0-9-]+$", message = "Код может содержать только заглавные буквы, цифры и дефис")
        String code,

        @NotBlank(message = "Название обязательно")
        @Size(max = 200, message = "Название не должно превышать 200 символов")
        String title,

        @Size(max = 5000, message = "Описание не должно превышать 5000 символов")
        String description,

        @NotBlank(message = "Жанр обязателен")
        @Size(max = 30)
        String genre,

        @Min(value = 0, message = "Возрастное ограничение не может быть отрицательным")
        @Max(value = 21, message = "Возрастное ограничение не может быть больше 21")
        Short ageLimit,

        @Min(value = 1, message = "Минимум игроков — 1")
        Short minPlayers,

        @Min(value = 1, message = "Максимум игроков — 1")
        Short maxPlayers,

        @Min(value = 1, message = "Длительность должна быть хотя бы 1 минута")
        @Max(value = 1440, message = "Длительность не может превышать 1440 минут (24 часа)")
        Integer durationMinutes,

        @Min(value = 0, message = "Цена не может быть отрицательной")
        Integer priceCents
) {
}