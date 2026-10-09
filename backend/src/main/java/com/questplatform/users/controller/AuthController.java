package com.questplatform.users.controller;

import com.questplatform.common.jwt.JwtService;
import com.questplatform.users.dto.AuthResponse;
import com.questplatform.users.dto.CreateUserRequest;
import com.questplatform.users.dto.LoginRequest;
import com.questplatform.users.dto.UserResponse;
import com.questplatform.users.entity.User;
import com.questplatform.users.mapper.UserMapper;
import com.questplatform.users.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST-контроллер аутентификации.
 *
 * <p>{@code @RequestMapping("/api/auth")} — все методы этого класса
 * получают префикс {@code /api/auth}.</p>
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final UserMapper userMapper;
    private final JwtService jwtService;

    public AuthController(UserService userService, UserMapper userMapper, JwtService jwtService) {
        this.userService = userService;
        this.userMapper = userMapper;
        this.jwtService = jwtService;
    }

    /**
     * Регистрация нового пользователя.
     *
     * <p>{@code @Valid} — запускает Bean Validation на {@code CreateUserRequest}.
     * При ошибке — Spring автоматически вернёт 400 Bad Request.</p>
     *
     * <p>{@code @RequestBody} — говорит Spring'у: возьми JSON из тела запроса
     * и десериализуй в {@code CreateUserRequest}.</p>
     *
     * <p>Возвращаем 201 Created, потому что мы создали ресурс.
     * По REST-соглашениям именно 201, а не 200.</p>
     */
    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody CreateUserRequest request) {
        User created = userService.createUser(
                request.email(),
                request.password(),
                request.displayName()
        );

        UserResponse response = userMapper.toResponse(created);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Вход в систему.
     *
     * <p>Проверяет креденшелы, обновляет {@code lastLoginAt},
     * генерирует JWT access-токен и возвращает его вместе с данными пользователя.</p>
     *
     * <p>Клиент сохраняет токен и прикладывает его к последующим запросам
     * в заголовке {@code Authorization: Bearer <token>}.</p>
     *
     * <p>Возвращаем 200 OK, потому что ресурс не создаётся —
     * только проверяются креденшелы и выдаётся токен.</p>
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        User user = userService.authenticate(request.email(), request.password());
        String token = jwtService.generateAccessToken(user.getId(), user.getEmail());
        UserResponse userResponse = userMapper.toResponse(user);
        return ResponseEntity.ok(AuthResponse.of(token, userResponse));
    }
}