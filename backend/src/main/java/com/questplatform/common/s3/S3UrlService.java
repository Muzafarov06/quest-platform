package com.questplatform.common.s3;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class S3UrlService {

    private final S3Presigner s3Presigner;
    private final S3Properties props;

    /**
     * Возвращает временную подписанную ссылку для чтения файла
     * из приватного S3-бакета.
     *
     * @param key ключ объекта в бакете, например:
     *            "b87bae84-cc9a-4616-b560-e8be2a75d7cb.png"
     */
    public String getFileUrl(String key) {
        if (key == null || key.isBlank()) {
            return null;
        }

        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(props.getBucket())
                .key(key)
                .responseCacheControl(
                        "public, max-age=" + props.getCacheControlMaxAgeSeconds() + ", immutable"
                )
                .build();

        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(props.getPresignedUrlTtlMinutes()))
                .getObjectRequest(getObjectRequest)
                .build();

        PresignedGetObjectRequest presignedRequest =
                s3Presigner.presignGetObject(presignRequest);

        return presignedRequest.url().toString();
    }
}