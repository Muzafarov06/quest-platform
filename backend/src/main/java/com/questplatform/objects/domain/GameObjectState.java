package com.questplatform.objects.domain;

/**
 * Состояние игрового объекта.
 *
 * <p>Хранится в БД как строка. Значения совпадают с CHECK в миграции V6.</p>
 */
public enum GameObjectState {
    CLOSED,
    OPEN,
    LOCKED,
    BROKEN
}