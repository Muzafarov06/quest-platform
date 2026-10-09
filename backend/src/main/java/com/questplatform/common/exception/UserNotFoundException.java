package com.questplatform.common.exception;

import org.springframework.http.HttpStatus;

import java.util.UUID;

/**
 * Кидается, когда запрошенный пользователь не найден.
 *
 * <p>HTTP-статус — 404 Not Found.</p>
 */
public class UserNotFoundException extends BusinessException {

    public UserNotFoundException(UUID id) {
        super("Пользователь не найден: " + id, HttpStatus.NOT_FOUND);
    }

    public UserNotFoundException(String email) {
        super("Пользователь не найден: " + email, HttpStatus.NOT_FOUND);
    }
}