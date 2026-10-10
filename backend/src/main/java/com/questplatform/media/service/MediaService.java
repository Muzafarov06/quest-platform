package com.questplatform.media.service;

import com.questplatform.cases.repository.CaseRepository;
import com.questplatform.common.exception.BusinessException;
import com.questplatform.common.exception.ResourceNotFoundException;
import com.questplatform.common.s3.S3Properties;
import com.questplatform.media.dto.MediaResponse;
import com.questplatform.media.dto.PresignUploadRequest;
import com.questplatform.media.dto.PresignUploadResponse;
import com.questplatform.media.entity.CaseMedia;
import com.questplatform.media.repository.CaseMediaRepository;
import com.questplatform.users.entity.User;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.io.IOException;
import java.net.URI;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class MediaService {

    private static final long MAX_FILE_SIZE = 10L * 1024 * 1024; // 10 MB
    private static final Set<String> ALLOWED_MIME = Set.of(
            "image/png", "image/jpeg", "image/webp",
            "audio/mpeg", "audio/ogg",
            "video/mp4", "application/pdf"
    );

    /**
     * Запас, на который мы сокращаем TTL presigned URL при кешировании,
     * чтобы клиент не получил ссылку за секунду до истечения.
     */
    private static final long PRESIGNED_URL_SAFETY_MARGIN_MINUTES = 60;

    /**
     * TTL presigned PUT URL для прямой загрузки в S3.
     * 30 минут с запасом хватит на любой аплоад.
     */
    private static final long PRESIGNED_PUT_TTL_MINUTES = 30;

    /**
     * In-memory кеш presigned GET URL: s3Key → (url, expiresAt).
     *
     * <p>Ключевой момент для быстрой отдачи картинок: если генерировать URL
     * на каждый запрос, браузер видит разные ссылки и не кеширует картинку.
     * С кешем URL стабилен в течение TTL, и браузер один раз скачивает
     * объект, дальше — из своего кеша.</p>
     *
     * <p>Заменяется на Caffeine/Redis, если backend запущен в нескольких
     * инстансах одновременно.</p>
     */
    private final Map<String, CachedPresignedUrl> presignedGetUrlCache = new ConcurrentHashMap<>();

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    private final S3Properties props;
    private final CaseMediaRepository mediaRepository;
    private final CaseRepository caseRepository;

    public MediaService(S3Client s3Client,
                        S3Properties props,
                        CaseMediaRepository mediaRepository,
                        CaseRepository caseRepository) {
        this.s3Client = s3Client;
        this.props = props;
        this.mediaRepository = mediaRepository;
        this.caseRepository = caseRepository;
        // pathStyleAccessEnabled(false) — как в S3Config.
        // Railway Buckets используют virtual-hosted-style.
        this.s3Presigner = S3Presigner.builder()
                .endpointOverride(URI.create(props.getEndpoint()))
                .credentialsProvider(s3Client.serviceClientConfiguration().credentialsProvider())
                .region(Region.of(props.getRegion()))
                .serviceConfiguration(S3Configuration.builder()
                        .pathStyleAccessEnabled(false)
                        .chunkedEncodingEnabled(false)
                        .build())
                .build();
    }

    /**
     * Создаёт presigned PUT URL, чтобы браузер загрузил файл НАПРЯМУЮ в S3,
     * минуя backend. В БД создаётся запись CaseMedia сразу, чтобы клиент
     * после успешной загрузки мог ей пользоваться.
     *
     * <p>Скорость: файл идёт по маршруту «браузер → S3», без хопа через
     * backend. Это в разы быстрее, чем multipart upload.</p>
     */
    @Transactional
    public PresignUploadResponse createPresignedUpload(PresignUploadRequest req, User user) {
        if (req.caseId() != null && !caseRepository.existsById(req.caseId())) {
            throw new ResourceNotFoundException("Кейс не найден: " + req.caseId());
        }
        if (req.sizeBytes() == null || req.sizeBytes() <= 0) {
            throw new BusinessException("Некорректный размер файла", HttpStatus.BAD_REQUEST);
        }
        if (req.sizeBytes() > MAX_FILE_SIZE) {
            throw new BusinessException("Файл больше 10 МБ", HttpStatus.BAD_REQUEST);
        }
        if (req.contentType() == null || !ALLOWED_MIME.contains(req.contentType())) {
            throw new BusinessException("Недопустимый тип файла: " + req.contentType(), HttpStatus.BAD_REQUEST);
        }

        String ext = extractExtension(req.originalName());
        String prefix = (req.caseId() != null) ? "cases/" + req.caseId() : "global";
        String s3Key = prefix + "/" + UUID.randomUUID() + (ext.isEmpty() ? "" : "." + ext);

        CaseMedia media = new CaseMedia();
        media.setCaseId(req.caseId());
        media.setS3Key(s3Key);
        media.setMimeType(req.contentType());
        media.setSizeBytes(req.sizeBytes());
        media.setOriginalName(req.originalName());
        media.setUploadedBy(user.getId());
        media = mediaRepository.save(media);

        String cacheControl = "public, max-age=" + props.getCacheControlMaxAgeSeconds() + ", immutable";

        PutObjectRequest putRequest = PutObjectRequest.builder()
                .bucket(props.getBucket())
                .key(s3Key)
                .contentType(req.contentType())
                .cacheControl(cacheControl)
                .build();

        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(PRESIGNED_PUT_TTL_MINUTES))
                .putObjectRequest(putRequest)
                .build();

        String uploadUrl = s3Presigner.presignPutObject(presignRequest).url().toString();

        return new PresignUploadResponse(media.getId(), uploadUrl, s3Key);
    }

    /**
     * Старый multipart-upload. Оставлен как fallback — если браузер
     * по какой-то причине не может напрямую в S3.
     */
    @Transactional
    public CaseMedia upload(UUID caseId, MultipartFile file, User user) {
        if (caseId != null && !caseRepository.existsById(caseId)) {
            throw new ResourceNotFoundException("Кейс не найден: " + caseId);
        }
        if (file.isEmpty()) {
            throw new BusinessException("Файл пустой", HttpStatus.BAD_REQUEST);
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BusinessException("Файл больше 10 МБ", HttpStatus.BAD_REQUEST);
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME.contains(contentType)) {
            throw new BusinessException("Недопустимый тип файла: " + contentType, HttpStatus.BAD_REQUEST);
        }

        String ext = extractExtension(file.getOriginalFilename());
        String prefix = (caseId != null) ? "cases/" + caseId : "global";
        String s3Key = prefix + "/" + UUID.randomUUID() + (ext.isEmpty() ? "" : "." + ext);

        String cacheControl = "public, max-age=" + props.getCacheControlMaxAgeSeconds() + ", immutable";

        try {
            s3Client.putObject(
                    PutObjectRequest.builder()
                            .bucket(props.getBucket())
                            .key(s3Key)
                            .contentType(contentType)
                            .cacheControl(cacheControl)
                            .build(),
                    RequestBody.fromBytes(file.getBytes())
            );
        } catch (IOException e) {
            throw new BusinessException("Ошибка чтения файла", HttpStatus.INTERNAL_SERVER_ERROR);
        }

        CaseMedia media = new CaseMedia();
        media.setCaseId(caseId);
        media.setS3Key(s3Key);
        media.setMimeType(contentType);
        media.setSizeBytes(file.getSize());
        media.setOriginalName(file.getOriginalFilename());
        media.setUploadedBy(user.getId());
        return mediaRepository.save(media);
    }

    @Transactional(readOnly = true)
    public MediaResponse getById(UUID mediaId) {
        CaseMedia media = mediaRepository.findById(mediaId)
                .orElseThrow(() -> new ResourceNotFoundException("Медиа не найдено: " + mediaId));
        return toResponse(media);
    }

    @Transactional(readOnly = true)
    public List<MediaResponse> getByCase(UUID caseId) {
        return mediaRepository.findByCaseIdOrderByCreatedAtAsc(caseId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void delete(UUID mediaId) {
        CaseMedia media = mediaRepository.findById(mediaId)
                .orElseThrow(() -> new ResourceNotFoundException("Медиа не найдено: " + mediaId));

        s3Client.deleteObject(DeleteObjectRequest.builder()
                .bucket(props.getBucket())
                .key(media.getS3Key())
                .build());

        // Чистим кеш, чтобы не отдавать ссылку на удалённый объект.
        presignedGetUrlCache.remove(media.getS3Key());

        mediaRepository.delete(media);
    }

    private MediaResponse toResponse(CaseMedia media) {
        String url = generatePresignedUrl(media.getS3Key());
        return new MediaResponse(
                media.getId(),
                media.getCaseId(),
                media.getOriginalName(),
                media.getMimeType(),
                media.getSizeBytes(),
                media.getWidth(),
                media.getHeight(),
                url,
                media.getCreatedAt()
        );
    }

    /**
     * Возвращает presigned URL из кеша, если он ещё валиден.
     * Иначе — генерирует новый и кладёт в кеш.
     *
     * <p>Благодаря кешу URL остаётся одинаковым между запросами —
     * браузер видит ту же ссылку и берёт картинку из своего кеша
     * вместо повторной загрузки из S3.</p>
     */
    private String generatePresignedUrl(String s3Key) {
        Instant now = Instant.now();

        CachedPresignedUrl cached = presignedGetUrlCache.get(s3Key);
        if (cached != null && cached.expiresAt().isAfter(now)) {
            return cached.url();
        }

        String cacheControl = "public, max-age=" + props.getCacheControlMaxAgeSeconds() + ", immutable";

        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(props.getBucket())
                .key(s3Key)
                // responseCacheControl форсирует заголовок Cache-Control в ответе,
                // даже если у объекта нет метаданных. Браузер точно закеширует.
                .responseCacheControl(cacheControl)
                .build();

        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(props.getPresignedUrlTtlMinutes()))
                .getObjectRequest(getObjectRequest)
                .build();

        String url = s3Presigner.presignGetObject(presignRequest).url().toString();

        // Кешируем чуть меньше TTL, чтобы не отдать ссылку за секунду до протухания.
        long effectiveTtlMinutes = Math.max(
                1,
                props.getPresignedUrlTtlMinutes() - PRESIGNED_URL_SAFETY_MARGIN_MINUTES
        );
        Instant expiresAt = now.plus(Duration.ofMinutes(effectiveTtlMinutes));
        presignedGetUrlCache.put(s3Key, new CachedPresignedUrl(url, expiresAt));

        return url;
    }

    private String extractExtension(String filename) {
        if (filename == null) return "";
        int dot = filename.lastIndexOf('.');
        if (dot < 0 || dot == filename.length() - 1) return "";
        return filename.substring(dot + 1).toLowerCase();
    }

    /**
     * Запись кеша presigned URL.
     */
    private record CachedPresignedUrl(String url, Instant expiresAt) {
    }
}