package com.questplatform.common.exception;

import org.springframework.http.HttpStatus;

import java.util.List;

/**
 * Кейс не готов к публикации. Возвращаем список причин.
 */
public class PublishValidationException extends BusinessException {

    private final List<String> reasons;

    public PublishValidationException(List<String> reasons) {
        super("Кейс не готов к публикации", HttpStatus.CONFLICT);
        this.reasons = reasons;
    }

    public List<String> getReasons() {
        return reasons;
    }
}