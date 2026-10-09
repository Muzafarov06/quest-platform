package com.questplatform.sessions.dto;

import com.questplatform.sessions.domain.SessionStatus;

import java.time.Instant;
import java.util.UUID;

public record SessionResponse(
        UUID id,
        UUID caseId,
        UUID ownerUserId,
        String roomCode,
        SessionStatus status,
        boolean isTest,
        Instant createdAt,
        Instant startedAt,
        Instant finishedAt
) {
}