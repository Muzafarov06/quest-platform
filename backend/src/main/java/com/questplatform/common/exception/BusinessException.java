package com.questplatform.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Базовое исключение для бизнес-ошибок.
 *
 * <p>Все конкретные бизнес-исключения наследуются от него:
 * {@link EmailAlreadyExistsException}, {@link UserNotFoundException} и т.д.</p>
 *
 * <p>Каждое исключение знает свой HTTP-статус — это позволяет
 * {@link GlobalExceptionHandler} мапить их в правильные ответы.</p>
 *
 * <p>Наследуемся от {@link RuntimeException} (unchecked), чтобы
 * {@code @Transactional} откатывал транзакцию автоматически
 * (откат происходит только для unchecked-исключений).</p>
 */
public class BusinessException extends RuntimeException {

    private final HttpStatus status;

    public BusinessException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}