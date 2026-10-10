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
 * <p>Создаёт бин {@link S3Client} для работы с S3-совместимым хранилищем.</p>
 *
 * <p>Важно: {@code chunkedEncodingEnabled(false)} — AWS SDK по умолчанию
 * загружает объекты со streaming-подписью, и S3-сервер возвращает заголовок
 * {@code Content-Encoding: aws-chunked}. Настоящий AWS S3 это понимает,
 * а некоторые S3-совместимые хранилища — нет: браузер пытается распаковать
 * ответ и получает битые данные. Поэтому chunked-encoding отключён глобально.</p>
 *
 * <p>Важно: {@code pathStyleAccessEnabled(false)} — Railway Buckets (и AWS S3)
 * используют virtual-hosted-style доступ, когда имя бакета является
 * поддоменом endpoint'а: {@code https://<bucket>.<endpoint>/...}.
 * При {@code true} SDK строит URL вида {@code https://<endpoint>/<bucket>/...},
 * и Railway отвечает 404 NoSuchBucket.</p>
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
                                // Railway Buckets / AWS S3 — virtual-hosted-style.
                                // Для локального SeaweedFS/MinIO нужно true.
                                .pathStyleAccessEnabled(false)
                                // Не отправлять chunked-encoding — иначе некоторые
                                // S3-совместимые хранилища возвращают
                                // Content-Encoding: aws-chunked, и браузер
                                // не может прочитать картинку.
                                .chunkedEncodingEnabled(false)
                                .build()
                )
                .build();
    }
}