package com.questplatform.sessions.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateSessionRequest(
        @NotNull(message = "caseId обязателен")
        UUID caseId
) {
}