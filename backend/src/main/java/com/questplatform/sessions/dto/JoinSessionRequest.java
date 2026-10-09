package com.questplatform.sessions.dto;

import jakarta.validation.constraints.Size;

/**
 * Запрос на вход в сессию.
 *
 * <p>Для зарегистрированного игрока — {@code displayName} игнорируется
 * (берётся из профиля). Для гостя — обязателен, проверяется в сервисе.</p>
 *
 * <p>{@code avatarKey} оставлен для совместимости, но не обязателен и
 * сейчас игнорируется: фигурку назначает бэкенд (первая свободная),
 * сменить можно через {@code PATCH /api/sessions/{id}/players/me/avatar}.</p>
 */
public record JoinSessionRequest(
        @Size(max = 50, message = "Имя должно быть не длиннее 50 символов")
        String displayName,

        @Size(max = 50, message = "Код фигурки не длиннее 50 символов")
        String avatarKey
) {
}