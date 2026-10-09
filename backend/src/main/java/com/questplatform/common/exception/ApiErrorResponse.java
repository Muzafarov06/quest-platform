package com.questplatform.common.exception;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.Map;

/**
 * Единый формат ответа об ошибке для всего API.
 *
 * <p>Все ошибки (validation, бизнес-логика, 404, 500) возвращаются в этом формате.
 * Фронт умеет обрабатывать один формат — не десять разных.</p>
 *
 * <p>{@code @JsonInclude(NON_NULL)} — поля со значением {@code null}
 * не попадают в JSON. Если нет ошибок валидации — поля {@code validationErrors}
 * в ответе не будет.</p>
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiErrorResponse(
        Instant timestamp,
        int status,
        String error,
        String message,
        String path,
        Map<String, String> validationErrors
) {
    /**
     * Удобный конструктор для случаев без validation errors.
     */
    public static ApiErrorResponse of(int status, String error, String message, String path) {
        return new ApiErrorResponse(Instant.now(), status, error, message, path, null);
    }

    /**
     * Удобный конструктор для validation errors.
     */
    public static ApiErrorResponse ofValidation(int status, String error, String message, String path,
                                                Map<String, String> validationErrors) {
        return new ApiErrorResponse(Instant.now(), status, error, message, path, validationErrors);
    }
}