package com.questplatform.admin.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record UpdateCaseRequest(
        @Size(max = 200, message = "Название не должно превышать 200 символов")
        String title,

        @Size(max = 5000, message = "Описание не должно превышать 5000 символов")
        String description,

        @Size(max = 30)
        String genre,

        @Min(0) @Max(21)
        Short ageLimit,

        @Min(1)
        Short minPlayers,

        @Min(1)
        Short maxPlayers,

        @Min(1) @Max(1440)
        Integer durationMinutes,

        @Min(0)
        Integer priceCents,

        UUID coverMediaId,

        UUID mapMediaId,
        UUID entryLocationId,

        @Min(800) @Max(8000)
        Integer mapWidth,

        @Min(600) @Max(6000)
        Integer mapHeight
) {
}