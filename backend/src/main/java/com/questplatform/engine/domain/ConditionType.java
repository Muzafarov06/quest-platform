package com.questplatform.engine.domain;

/**
 * Тип условия. Совпадает с CHECK в V12.
 */
public enum ConditionType {
    OBJECT_INTERACTED,
    LOCATION_VISITED,
    EVIDENCE_DISCOVERED,
    PUZZLE_SOLVED
}