package com.questplatform.sessions.event;

import java.util.UUID;

/**
 * Spring-событие: сессия завершена.
 *
 * <p>Публикуется внутри транзакции, слушается ПОСЛЕ коммита
 * (см. {@code SessionFinishedListener}). Так WebSocket-рассылка
 * не обгоняет сохранение финального ответа в БД.</p>
 */
public record SessionFinishedEvent(UUID sessionId) {
}