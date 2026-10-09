package com.questplatform.evidences.domain;

/**
 * Важность улики.
 * KEY — ключевая для разгадки.
 * SUPPORTING — подкрепляющая.
 * RED_HERRING — ложный след.
 */
public enum EvidenceImportance {
    KEY,
    SUPPORTING,
    RED_HERRING
}