package com.questplatform.locations.domain;

/**
 * Как локация становится доступной игрокам.
 *
 * <p>{@code ALWAYS}      — открыта с начала сессии (штаб, стартовая улица).</p>
 * <p>{@code ON_EVIDENCE} — после находки улики с {@code discoveryTargetId}.</p>
 * <p>{@code ON_DIALOG}   — после диалога с персонажем {@code discoveryTargetId}.</p>
 * <p>{@code ON_LOCATION} — после посещения локации {@code discoveryTargetId}.</p>
 * <p>{@code ON_MANUAL}   — только через событие UNLOCK_LOCATION (звонок, SMS, координаты).</p>
 */
public enum DiscoveryMode {
    ALWAYS,
    ON_EVIDENCE,
    ON_DIALOG,
    ON_LOCATION,
    ON_MANUAL
}