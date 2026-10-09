package com.questplatform.users.dto;

/**
 * Ответ на успешный логин.
 *
 * <p>Содержит access-токен и данные пользователя.
 * Токен клиент сохраняет (в памяти или localStorage) и прикладывает
 * к последующим запросам в заголовке {@code Authorization: Bearer <token>}.</p>
 */
public record AuthResponse(
        String accessToken,
        String tokenType,
        UserResponse user
) {
    public static AuthResponse of(String accessToken, UserResponse user) {
        return new AuthResponse(accessToken, "Bearer", user);
    }
}