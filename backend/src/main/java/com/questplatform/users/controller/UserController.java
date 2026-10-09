package com.questplatform.users.controller;

import com.questplatform.users.dto.UserResponse;
import com.questplatform.users.entity.User;
import com.questplatform.users.mapper.UserMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST-контроллер пользователей.
 *
 * <p>Все endpoint'ы требуют валидного JWT — Security настроен так,
 * что /api/users/** не входит в permitAll.</p>
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserMapper userMapper;

    public UserController(UserMapper userMapper) {
        this.userMapper = userMapper;
    }

    /**
     * Возвращает данные текущего пользователя.
     *
     * <p>{@code @AuthenticationPrincipal User user} — Spring подставит
     * сюда principal из Security Context. У нас principal — это {@code User}
     * (мы положили его в {@code JwtAuthenticationFilter}).</p>
     *
     * <p>Если пользователь не аутентифицирован, запрос не дойдёт сюда —
     * Security вернёт 401 через {@code AuthenticationEntryPoint}.</p>
     */
    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(@AuthenticationPrincipal User user) {
        UserResponse response = userMapper.toResponse(user);
        return ResponseEntity.ok(response);
    }
}