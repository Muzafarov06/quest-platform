package com.questplatform.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Кидается, когда пытаются зарегистрировать email,
 * который уже есть в системе.
 *
 * <p>HTTP-статус — 409 Conflict. Это правильнее, чем 400,
 * потому что запрос сам по себе валиден — просто конфликтует
 * с текущим состоянием системы.</p>
 */
public class EmailAlreadyExistsException extends BusinessException {

    public EmailAlreadyExistsException(String email) {
        super("Email уже занят: " + email, HttpStatus.CONFLICT);
    }
}