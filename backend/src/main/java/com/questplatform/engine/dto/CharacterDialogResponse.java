package com.questplatform.engine.dto;

import java.util.UUID;

public record CharacterDialogResponse(
        UUID id,
        String question,
        String answer,
        UUID requiresEvidenceId,
        int sortOrder
) {
}