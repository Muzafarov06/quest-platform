package com.questplatform.sessions.dto;

import java.util.UUID;

/**
 * Ответ на вход в сессию.
 *
 * <p>{@code guestToken} возвращается только гостям. Фронт сохраняет его
 * в localStorage и прикладывает к последующим запросам в заголовке
 * {@code X-Guest-Token}.</p>
 */
public record JoinSessionResponse(
        SessionResponse session,
        SessionPlayerResponse player,
        UUID guestToken
) {
}