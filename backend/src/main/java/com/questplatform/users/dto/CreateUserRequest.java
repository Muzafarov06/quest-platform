package com.questplatform.users.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Запрос на регистрацию нового пользователя.
 *
 * <p>Bean Validation аннотации ({@code @NotBlank}, {@code @Email}, ...)
 * проверяются Spring'ом ДО вызова метода контроллера.
 * Если данные невалидны — вернётся 400 Bad Request с описанием ошибок.</p>
 */
public record CreateUserRequest(

        @NotBlank(message = "Email обязателен")
        @Email(message = "Некорректный формат email")
        @Size(max = 255, message = "Email не должен превышать 255 символов")
        String email,

        @NotBlank(message = "Пароль обязателен")
        @Size(min = 8, max = 100, message = "Пароль должен быть от 8 до 100 символов")
        String password,

        @NotBlank(message = "Имя обязательно")
        @Size(min = 2, max = 50, message = "Имя должно быть от 2 до 50 символов")
        String displayName
) {
}