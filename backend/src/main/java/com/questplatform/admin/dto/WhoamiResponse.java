package com.questplatform.admin.dto;

import java.util.List;
import java.util.UUID;

/**
 * Ответ на GET /api/admin/whoami.
 * Нужен для диагностики: проверить, что роли подхватываются правильно.
 */
public record WhoamiResponse(
        UUID userId,
        String email,
        String displayName,
        List<String> roles
) {
}