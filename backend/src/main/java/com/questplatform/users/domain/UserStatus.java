package com.questplatform.users.domain;

/**
 * Статус пользователя.
 *
 * <p>Хранится в БД как строка (VARCHAR) через {@code @Enumerated(EnumType.STRING)}.
 * Значения должны совпадать с CHECK constraint в миграции V1:
 * {@code CHECK (status IN ('ACTIVE', 'BLOCKED', 'DELETED'))}.</p>
 */
public enum UserStatus {
    ACTIVE,
    BLOCKED,
    DELETED
}