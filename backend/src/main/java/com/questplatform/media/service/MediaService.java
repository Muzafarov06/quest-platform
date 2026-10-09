package com.questplatform.media.service;

import com.questplatform.cases.repository.CaseRepository;
import com.questplatform.common.exception.BusinessException;
import com.questplatform.common.exception.ResourceNotFoundException;
import com.questplatform.common.s3.S3Properties;
import com.questplatform.media.dto.MediaResponse;
import com.questplatform.media.entity.CaseMedia;
import com.questplatform.media.repository.CaseMediaRepository;
import com.questplatform.users.entity.User;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

import java.io.IOException;
import java.time.Duration;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class MediaService {

    private static final long MAX_FILE_SIZE = 10L * 1024 * 1024; // 10 MB
    private static final Set<String> ALLOWED_MIME = Set.of(
            "image/png", "image/jpeg", "image/webp",
            "audio/mpeg", "audio/ogg",
            "video/mp4", "application/pdf"
    );

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
        this.s3Presigner = S3Presigner.builder()
                .endpointOverride(java.net.URI.create(props.getEndpoint()))
                .credentialsProvider(s3Client.serviceClientConfiguration().credentialsProvider())
                .region(software.amazon.awssdk.regions.Region.of(props.getRegion()))
                .serviceConfiguration(software.amazon.awssdk.services.s3.S3Configuration.builder()
                        .pathStyleAccessEnabled(true)
                        .chunkedEncodingEnabled(false)
                        .build())
                .build();
    }

    /**
     * Загрузить файл в S3 и сохранить metadata в БД.
     *
     * <p>{@code caseId} может быть {@code null} — это глобальное медиа
     * (например, PNG фигурок в лобби). Оно не привязано к кейсу.</p>
     */
    @Transactional
    public CaseMedia upload(UUID caseId, MultipartFile file, User user) {
        // Проверка кейса только если caseId задан
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

        try {
            s3Client.putObject(
                    PutObjectRequest.builder()
                            .bucket(props.getBucket())
                            .key(s3Key)
                            .contentType(contentType)
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

    private String generatePresignedUrl(String s3Key) {
        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(props.getBucket())
                .key(s3Key)
                .build();

        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(props.getPresignedUrlTtlMinutes()))
                .getObjectRequest(getObjectRequest)
                .build();

        return s3Presigner.presignGetObject(presignRequest).url().toString();
    }

    private String extractExtension(String filename) {
        if (filename == null) return "";
        int dot = filename.lastIndexOf('.');
        if (dot < 0 || dot == filename.length() - 1) return "";
        return filename.substring(dot + 1).toLowerCase();
    }
}