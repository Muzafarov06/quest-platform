package com.questplatform.common.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Настройки LiveKit.
 *
 * <p>Читаются из application.yml с префиксом {@code app.livekit}.
 * Значения приходят из environment variables (см. .env).</p>
 *
 * <p>Регистрируется как бин через {@code @ConfigurationPropertiesScan}
 * на {@code BackendApplication} — отдельная аннотация не нужна.</p>
 */
@ConfigurationProperties(prefix = "app.livekit")
@Getter
@Setter
public class LiveKitProperties {

    /** WebSocket URL сервера. Для dev — ws://localhost:7880 */
    private String url;

    /** API Key из livekit.yaml */
    private String apiKey;

    /** API Secret из livekit.yaml. Минимум 32 символа. */
    private String apiSecret;

    /** Время жизни токена в секундах. */
    private long tokenTtlSeconds = 3600;
}