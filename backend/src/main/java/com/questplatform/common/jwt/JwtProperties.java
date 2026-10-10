package com.questplatform.common.jwt;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Настройки JWT.
 *
 * <p>{@code @ConfigurationProperties(prefix = "app.jwt")} — Spring прочитает
 * из application.yml все свойства с префиксом {@code app.jwt}.</p>
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
     *
     * <p>7 дней по умолчанию — чтобы пользователя не выкидывало
     * после 15 минут. Если появится refresh-механизм, TTL можно
     * снова уменьшить до 15–30 минут.</p>
     */
    private long accessTtlMinutes = 10080;
}