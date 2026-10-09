package com.questplatform.sessions.dto;

import jakarta.validation.constraints.NotNull;

public record SetReadyRequest(
        @NotNull(message = "ready обязателен")
        Boolean ready
) {
}