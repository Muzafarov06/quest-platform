package com.questplatform.common.s3;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.s3")
@Getter
@Setter
public class S3Properties {

    private String endpoint;

    private String region;

    private String bucket;

    private String accessKey;

    private String secretKey;

    /**
     * Время жизни presigned GET URL.
     */
    private long presignedUrlTtlMinutes = 60;

    /**
     * Cache-Control для загруженных объектов.
     */
    private long cacheControlMaxAgeSeconds = 31536000;
}