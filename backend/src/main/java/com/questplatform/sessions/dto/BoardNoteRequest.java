package com.questplatform.sessions.dto;

import jakarta.validation.constraints.Size;

public record BoardNoteRequest(
        @Size(max = 50000)
        String text
) {
}