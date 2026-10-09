package com.questplatform.evidences.domain;

/**
 * Тип улики.
 * Совпадает с CHECK constraint в миграции V8.
 */
public enum EvidenceType {
    DOCUMENT,
    PHOTO,
    AUDIO,
    VIDEO,
    PHYSICAL,
    DIGITAL,
    TESTIMONY,
    OTHER
}