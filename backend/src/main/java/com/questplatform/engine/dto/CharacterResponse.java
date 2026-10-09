package com.questplatform.engine.dto;

import java.util.List;
import java.util.UUID;

public record CharacterResponse(
        UUID id,
        UUID caseId,
        UUID locationId,
        String name,
        String description,
        UUID portraitMediaId,
        UUID dialogueMediaId,
        int sortOrder,
        float posX,
        float posY,
        float sceneScale,
        float sceneRotation,
        String unlockMode,
        UUID unlockTargetId,
        List<CharacterDialogResponse> dialogs
) {
}