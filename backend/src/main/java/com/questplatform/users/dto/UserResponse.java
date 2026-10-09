package com.questplatform.users.dto;

import com.questplatform.users.domain.UserStatus;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Публичное представление пользователя для API.
 *
 * <p>НЕ содержит: passwordHash, любые внутренние поля.
 * Только то, что можно показывать клиенту.</p>
 */
public record UserResponse(
        UUID id,
        String email,
        String displayName,
        String avatarKey,
        UserStatus status,
        Instant createdAt,
        List<String> roles
) {
}