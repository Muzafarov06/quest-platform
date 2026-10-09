package com.questplatform.engine.domain;

/**
 * Тип события. Совпадает с CHECK в V12 и V45.
 *
 * <p>{@code DISPATCH_CALL} — сообщение от диспетчера. На фронте
 * не показывается модалкой, а складывается в отдельную панель
 * «звонки». Текст берётся из поля {@code message}.</p>
 */
public enum EventType {
    SHOW_MESSAGE,
    REVEAL_EVIDENCE,
    UNLOCK_OBJECT,
    UNLOCK_LOCATION,
    DISPATCH_CALL
}