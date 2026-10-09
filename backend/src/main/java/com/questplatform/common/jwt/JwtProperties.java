package com.questplatform.common.jwt;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Настройки JWT.
 *
 * <p>{@code @ConfigurationProperties(prefix = "app.jwt")} — Spring прочитает
 * из application.yml все свойства с префиксом {@code app.jwt} и подставит их
 * в поля этого класса. Например:
 * <ul>
 *   <li>{@code app.jwt.secret} → {@code secret}</li>
 *   <li>{@code app.jwt.access-ttl-minutes} → {@code accessTtlMinutes}</li>
 * </ul>
 * </p>
 *
 * <p>Регистрируется как бин через {@code @ConfigurationPropertiesScan}
 * на {@code BackendApplication}.</p>
 */
@ConfigurationProperties(prefix = "app.jwt")
@Getter
@Setter
public class JwtProperties {

    /**
     * Секрет для подписи токенов. Должен быть ≥32 символов.
     */
    private String secret;

    /**
     * Время жизни access-токена в минутах.
     */
    private long accessTtlMinutes = 15;
}