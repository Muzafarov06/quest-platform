package com.questplatform.common.s3;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Настройки S3-совместимого хранилища.
 *
 * <p>Читаются из application.yml с префиксом {@code app.s3}.
 * Значения приходят из environment variables (см. {@code .env}).</p>
 */
@ConfigurationProperties(prefix = "app.s3")
@Getter
@Setter
public class S3Properties {

    /** URL S3 API. */
    private String endpoint;

    /** Access key. */
    private String accessKey;

    /** Secret key. */
    private String secretKey;

    /** Имя бакета для медиа. */
    private String bucket;

    /** Регион. Для Railway Bucket — auto. */
    private String region = "us-east-1";

    /**
     * Presigned URL живёт N минут. 7 дней — чтобы браузер мог
     * закешировать картинку и не ходить в S3 каждый раз.
     */
    private long presignedUrlTtlMinutes = 10080;

    /**
     * Cache-Control max-age для загружаемых объектов, в секундах.
     * 1 год — картинки не меняются, можно смело кешировать навсегда.
     */
    private long cacheControlMaxAgeSeconds = 31536000;
}