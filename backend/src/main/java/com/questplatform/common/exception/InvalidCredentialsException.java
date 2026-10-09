package com.questplatform.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Кидается при неудачной попытке входа — неверный email или пароль.
 *
 * <p>HTTP-статус 401 Unauthorized. Сообщение НЕ уточняет, что именно неверно
 * (email или пароль) — иначе атакующий может перебором email'ов
 * строить список зарегистрированных пользователей.</p>
 */
public class InvalidCredentialsException extends BusinessException {

    public InvalidCredentialsException() {
        super("Неверный email или пароль", HttpStatus.UNAUTHORIZED);
    }
}