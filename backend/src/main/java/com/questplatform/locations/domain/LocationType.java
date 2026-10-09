package com.questplatform.locations.domain;

/**
 * Тип локации.
 *
 * <p>Хранится в БД как строка через {@code @Enumerated(EnumType.STRING)}.
 * Значения совпадают с CHECK constraint в миграции V4.</p>
 */
public enum LocationType {
    HOUSE,
    ROOM,
    STREET,
    FOREST,
    VEHICLE,
    DIGITAL,
    BUILDING,
    OTHER
}