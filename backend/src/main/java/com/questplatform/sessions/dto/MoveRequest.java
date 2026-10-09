package com.questplatform.sessions.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.util.UUID;

public record MoveRequest(
        @NotNull @Min(0) @Max(100)
        Float x,

        @NotNull @Min(0) @Max(100)
        Float y,

        @NotNull
        @Pattern(regexp = "UP|DOWN|LEFT|RIGHT")
        String facing,

        /** Локация, где игрок сейчас. null — на карте дела. */
        UUID locationId
) {
}