package com.questplatform.cases.domain;

/**
 * Статус кейса.
 *
 * <p>Хранится в БД как строка (VARCHAR) через {@code @Enumerated(EnumType.STRING)}.
 * Значения совпадают с CHECK constraint в миграции V2.</p>
 *
 * <p>Жизненный цикл:
 * <pre>
 *   DRAFT → TESTING → PUBLISHED → ARCHIVED
 * </pre>
 * Автор двигает кейс вперёд. Обратно — только PUBLISHED → ARCHIVED.
 * </p>
 */
public enum CaseStatus {
    DRAFT,
    TESTING,
    PUBLISHED,
    ARCHIVED
}