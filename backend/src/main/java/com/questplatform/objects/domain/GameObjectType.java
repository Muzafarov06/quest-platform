package com.questplatform.objects.domain;

/**
 * Тип игрового объекта.
 *
 * <p>Хранится в БД как строка. Значения совпадают с CHECK в миграциях V6 и V48.</p>
 *
 * <p>{@code INTERROGATION_PHONE} — особый тип: при клике на такой объект
 * игроку открывается список персонажей для вызова на допрос. Используется
 * в штабе, чтобы допросить персонажей, не привязанных к локации.</p>
 */
public enum GameObjectType {
    TELEPHONE,
    COMPUTER,
    DOOR,
    SAFE,
    CONTAINER,
    DOCUMENT,
    ITEM,
    OTHER,
    INTERROGATION_PHONE
}