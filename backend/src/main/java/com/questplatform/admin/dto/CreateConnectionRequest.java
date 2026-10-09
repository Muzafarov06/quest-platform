package com.questplatform.admin.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateConnectionRequest(
        @NotNull(message = "Целевая локация обязательна")
        UUID toLocationId,

        @Size(max = 200)
        String label,

        Integer sortOrder
) {
}