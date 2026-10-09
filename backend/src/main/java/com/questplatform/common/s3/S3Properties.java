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

    /** URL S3 API. Для локального SeaweedFS — http://localhost:8333. */
    private String endpoint;

    /** Access key. SeaweedFS в dev не проверяет, но SDK требует непустое. */
    private String accessKey;

    /** Secret key. */
    private String secretKey;

    /** Имя бакета для медиа. */
    private String bucket;

    /** Регион. Для SeaweedFS — us-east-1. */
    private String region = "us-east-1";

    /** Presigned URL живёт N минут. */
    private long presignedUrlTtlMinutes = 60;
}