package com.questplatform.sessions.dto;

import jakarta.validation.constraints.Size;

import java.util.UUID;

/**
 * Транзитное событие «игрок печатает в общей заметке».
 * Не сохраняется в БД — только рассылается участникам через WS.
 */
public record BoardNoteTypingRequest(
        UUID userId,
        @Size(max = 50000) String text
) {
}