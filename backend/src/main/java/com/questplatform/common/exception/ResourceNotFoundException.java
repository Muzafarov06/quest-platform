package com.questplatform.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Кидается, когда запрошенный ресурс не найден. HTTP 404.
 */
public class ResourceNotFoundException extends BusinessException {

    public ResourceNotFoundException(String message) {
        super(message, HttpStatus.NOT_FOUND);
    }
}