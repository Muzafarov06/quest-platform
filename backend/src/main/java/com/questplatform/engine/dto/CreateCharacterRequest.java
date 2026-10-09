package com.questplatform.engine.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateCharacterRequest(
        @NotBlank(message = "Имя обязательно")
        @Size(max = 200)
        String name,

        @Size(max = 5000)
        String description,

        @Size(max = 10000)
        String biography,

        UUID locationId,
        UUID portraitMediaId,
        UUID dialogueMediaId,
        Integer sortOrder,

        @Min(0) @Max(100)
        Float posX,

        @Min(0) @Max(100)
        Float posY,

        @Pattern(regexp = "AUTO|ALWAYS|LOCATION_OPENED|EVIDENCE_FOUND",
                message = "Недопустимый режим открытия")
        String unlockMode,

        UUID unlockTargetId
) {
}