package com.questplatform.admin.controller;

import com.questplatform.admin.dto.WhoamiResponse;
import com.questplatform.users.entity.Role;
import com.questplatform.users.entity.User;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Диагностические endpoint'ы админки.
 *
 * <p>{@code @PreAuthorize} на уровне класса — все методы требуют ADMIN.
 * Если роль не совпадает — Spring вернёт 403 Forbidden.</p>
 */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    /**
     * Возвращает данные текущего админа и его роли.
     *
     * <p>Используется для проверки, что роли подхватываются правильно:
     * если ты получил 200 и видишь {@code ["USER","ADMIN"]} — система ролей
     * работает. Если обычный пользователь получит 403 — авторизация работает.</p>
     */
    @GetMapping("/whoami")
    public ResponseEntity<WhoamiResponse> whoami(@AuthenticationPrincipal User user) {
        List<String> roles = user.getRoles().stream()
                .map(Role::getCode)
                .sorted()
                .toList();
        return ResponseEntity.ok(new WhoamiResponse(
                user.getId(),
                user.getEmail(),
                user.getDisplayName(),
                roles
        ));
    }
}