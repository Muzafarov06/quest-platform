package com.questplatform.common.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.time.Instant;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Глобальный обработчик исключений для всех контроллеров.
 *
 * <p>{@code @RestControllerAdvice} — композитная аннотация:
 * {@code @ControllerAdvice} + {@code @ResponseBody}.
 * Spring вызывает методы этого класса, когда в любом контроллере
 * выпадает исключение, подходящее под {@code @ExceptionHandler}.</p>
 *
 * <p>Задача — преобразовать исключение в {@link ApiErrorResponse}
 * с правильным HTTP-статусом, чтобы клиент всегда получал единый формат.</p>
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Обрабатывает все {@link BusinessException} и наследников.
     *
     * <p>Возвращает статус, который исключение само указало.</p>
     */
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiErrorResponse> handleBusinessException(
            BusinessException ex,
            HttpServletRequest request
    ) {
        HttpStatus status = ex.getStatus();
        ApiErrorResponse body = ApiErrorResponse.of(
                status.value(),
                status.getReasonPhrase(),
                ex.getMessage(),
                request.getRequestURI()
        );
        return ResponseEntity.status(status).body(body);
    }

    /**
     * Публикация кейса не прошла валидацию. Возвращаем 409 + список причин,
     * чтобы фронт показал пользователю, что именно не так.
     *
     * <p>Формат отличается от {@link ApiErrorResponse}: добавляем поле
     * {@code reasons}. Обрабатываем отдельно, а не как обычный
     * BusinessException, чтобы не терять этот список.</p>
     */
    @ExceptionHandler(com.questplatform.common.exception.PublishValidationException.class)
    public ResponseEntity<Map<String, Object>> handlePublishValidation(
            com.questplatform.common.exception.PublishValidationException ex,
            HttpServletRequest request
    ) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", Instant.now());
        body.put("status", HttpStatus.CONFLICT.value());
        body.put("error", HttpStatus.CONFLICT.getReasonPhrase());
        body.put("message", ex.getMessage());
        body.put("path", request.getRequestURI());
        body.put("reasons", ex.getReasons());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    /**
     * Обрабатывает ошибки Bean Validation ({@code @Valid}).
     *
     * <p>Срабатывает, когда в {@code @RequestBody} есть {@code @Valid}
     * и хотя бы одно ограничение ({@code @Email}, {@code @NotBlank}, ...)
     * не прошло.</p>
     *
     * <p>Собирает все ошибки в map {@code fieldName → message}
     * и возвращает 400 Bad Request.</p>
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(
            MethodArgumentNotValidException ex,
            HttpServletRequest request
    ) {
        Map<String, String> errors = new HashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            errors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }

        ApiErrorResponse body = ApiErrorResponse.ofValidation(
                HttpStatus.BAD_REQUEST.value(),
                HttpStatus.BAD_REQUEST.getReasonPhrase(),
                "Ошибка валидации входных данных",
                request.getRequestURI(),
                errors
        );
        return ResponseEntity.badRequest().body(body);
    }

    /**
     * Обрабатывает отказ в доступе от {@code @PreAuthorize}.
     *
     * <p>Spring Security бросает {@code AuthorizationDeniedException}
     * (наследник {@link AccessDeniedException}) на method interceptor,
     * который расположен ВНУТРИ DispatcherServlet. Поэтому фильтры
     * безопасности (AuthenticationEntryPoint/AccessDeniedHandler)
     * его не видят — исключение летит прямо в {@code @RestControllerAdvice}.</p>
     *
     * <p>Без этого метода {@link #handleGeneric} перехватил бы его
     * и вернул 500, что неверно: пользователь аутентифицирован,
     * но не имеет прав → правильный ответ 403 Forbidden.</p>
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiErrorResponse> handleAccessDenied(
            AccessDeniedException ex,
            HttpServletRequest request
    ) {
        ApiErrorResponse body = ApiErrorResponse.of(
                HttpStatus.FORBIDDEN.value(),
                HttpStatus.FORBIDDEN.getReasonPhrase(),
                "Доступ запрещён",
                request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
    }

    /**
     * Обрабатывает запросы к несуществующим URL.
     *
     * <p>Spring MVC кидает {@link NoResourceFoundException}, когда
     * endpoint не найден. Без этого обработчика общий
     * {@code @ExceptionHandler(Exception.class)} вернул бы 500,
     * что вводит в заблуждение — ресурса просто нет.</p>
     */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleNoResourceFound(
            NoResourceFoundException ex,
            HttpServletRequest request
    ) {
        ApiErrorResponse body = ApiErrorResponse.of(
                HttpStatus.NOT_FOUND.value(),
                HttpStatus.NOT_FOUND.getReasonPhrase(),
                "Ресурс не найден",
                request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    /**
     * Обрабатывает все прочие исключения — чтобы клиент всегда получал
     * единый формат, а не стандартный Spring Whitelabel Error Page.
     *
     * <p>Логируем — здесь могут быть баги. Клиенту — общее сообщение,
     * без деталей (чтобы не утекала внутренняя информация).</p>
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleGeneric(
            Exception ex,
            HttpServletRequest request
    ) {
        // В реальном проекте — логировать через slf4j на уровне ERROR
        // с полным stacktrace. Здесь для краткости — System.err.
        System.err.println("Unhandled exception: " + ex.getMessage());

        ApiErrorResponse body = ApiErrorResponse.of(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                HttpStatus.INTERNAL_SERVER_ERROR.getReasonPhrase(),
                "Внутренняя ошибка сервера",
                request.getRequestURI()
        );
        return ResponseEntity.internalServerError().body(body);
    }
}