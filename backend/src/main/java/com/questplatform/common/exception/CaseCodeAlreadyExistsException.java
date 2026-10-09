package com.questplatform.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Кидается при попытке создать кейс с уже существующим code.
 * HTTP 409 Conflict.
 */
public class CaseCodeAlreadyExistsException extends BusinessException {

    public CaseCodeAlreadyExistsException(String code) {
        super("Кейс с таким кодом уже существует: " + code, HttpStatus.CONFLICT);
    }
}