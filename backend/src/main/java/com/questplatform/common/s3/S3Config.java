package com.questplatform.common.s3;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;

import java.net.URI;

/**
 * Конфигурация S3-клиента.
 *
 * <p>Создаёт бин {@link S3Client} для работы с S3-совместимым хранилищем.
 * Подходит для AWS S3, MinIO, SeaweedFS, Yandex Object Storage.</p>
 *
 * <p>Важно: {@code chunkedEncodingEnabled(false)} — AWS SDK по умолчанию
 * загружает объекты со streaming-подписью, и S3-сервер возвращает заголовок
 * {@code Content-Encoding: aws-chunked}. Настоящий AWS S3 это понимает,
 * а SeaweedFS — нет: браузер пытается распаковать ответ и получает битые
 * данные. Поэтому chunked-encoding отключён глобально.</p>
 */
@Configuration
public class S3Config {

    @Bean
    public S3Client s3Client(S3Properties props) {
        return S3Client.builder()
                .endpointOverride(URI.create(props.getEndpoint()))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(props.getAccessKey(), props.getSecretKey())
                ))
                .region(Region.of(props.getRegion()))
                .serviceConfiguration(
                        S3Configuration.builder()
                                // Path-style для локальных S3-совместимых хранилищ.
                                // AWS использует virtual-hosted style, но MinIO/SeaweedFS — path-style.
                                .pathStyleAccessEnabled(true)
                                // Не отправлять chunked-encoding — иначе SeaweedFS
                                // возвращает Content-Encoding: aws-chunked, и браузер
                                // не может прочитать картинку.
                                .chunkedEncodingEnabled(false)
                                .build()
                )
                .build();
    }
}