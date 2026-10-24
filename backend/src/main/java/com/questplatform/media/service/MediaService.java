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
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.io.IOException;
import java.time.Duration;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class MediaService {

    private static final long MAX_FILE_SIZE = 10L * 1024 * 1024;

    private static final Set<String> ALLOWED_MIME = Set.of(
            "image/png", "image/jpeg", "image/webp",
            "audio/mpeg", "audio/ogg",
            "video/mp4", "application/pdf"
    );

    private static final long PRESIGNED_PUT_TTL_MINUTES = 30;

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    private final S3Properties props;
    private final CaseMediaRepository mediaRepository;
    private final CaseRepository caseRepository;

    public MediaService(S3Client s3Client,
                        S3Presigner s3Presigner,
                        S3Properties props,
                        CaseMediaRepository mediaRepository,
                        CaseRepository caseRepository) {
        this.s3Client = s3Client;
        this.s3Presigner = s3Presigner;
        this.props = props;
        this.mediaRepository = mediaRepository;
        this.caseRepository = caseRepository;
    }

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
            throw new BusinessException(
                    "Недопустимый тип файла: " + req.contentType(),
                    HttpStatus.BAD_REQUEST
            );
        }

        String ext = extractExtension(req.originalName());
        String prefix = req.caseId() != null ? "cases/" + req.caseId() : "global";
        String s3Key = prefix + "/" + UUID.randomUUID() + (ext.isEmpty() ? "" : "." + ext);

        CaseMedia media = new CaseMedia();
        media.setCaseId(req.caseId());
        media.setS3Key(s3Key);
        media.setMimeType(req.contentType());
        media.setSizeBytes(req.sizeBytes());
        media.setOriginalName(req.originalName());
        media.setUploadedBy(user.getId());
        media = mediaRepository.save(media);

        PutObjectRequest putRequest = PutObjectRequest.builder()
                .bucket(props.getBucket())
                .key(s3Key)
                .contentType(req.contentType())
                .cacheControl(buildCacheControl())
                .build();

        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(PRESIGNED_PUT_TTL_MINUTES))
                .putObjectRequest(putRequest)
                .build();

        String uploadUrl = s3Presigner
                .presignPutObject(presignRequest)
                .url()
                .toString();

        return new PresignUploadResponse(media.getId(), uploadUrl, s3Key);
    }

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
            throw new BusinessException(
                    "Недопустимый тип файла: " + contentType,
                    HttpStatus.BAD_REQUEST
            );
        }

        String ext = extractExtension(file.getOriginalFilename());
        String prefix = caseId != null ? "cases/" + caseId : "global";
        String s3Key = prefix + "/" + UUID.randomUUID() + (ext.isEmpty() ? "" : "." + ext);

        try {
            s3Client.putObject(
                    PutObjectRequest.builder()
                            .bucket(props.getBucket())
                            .key(s3Key)
                            .contentType(contentType)
                            .cacheControl(buildCacheControl())
                            .build(),
                    RequestBody.fromBytes(file.getBytes())
            );
        } catch (IOException e) {
            throw new BusinessException(
                    "Ошибка чтения файла",
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
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
        CaseMedia media = getMedia(mediaId);

        return new MediaResponse(
                media.getId(),
                media.getCaseId(),
                media.getOriginalName(),
                media.getMimeType(),
                media.getSizeBytes(),
                media.getWidth(),
                media.getHeight(),
                "/api/media/" + media.getId() + "/file",
                media.getCreatedAt()
        );
    }

    @Transactional(readOnly = true)
    public List<MediaResponse> getByCase(UUID caseId) {
        return mediaRepository.findByCaseIdOrderByCreatedAtAsc(caseId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public MediaFile getFile(UUID mediaId) {
        CaseMedia media = getMedia(mediaId);

        GetObjectRequest request = GetObjectRequest.builder()
                .bucket(props.getBucket())
                .key(media.getS3Key())
                .build();

        ResponseInputStream<GetObjectResponse> stream = s3Client.getObject(request);

        return new MediaFile(
                stream,
                media.getMimeType(),
                media.getSizeBytes(),
                media.getOriginalName()
        );
    }

    @Transactional
    public void delete(UUID mediaId) {
        CaseMedia media = getMedia(mediaId);

        s3Client.deleteObject(
                software.amazon.awssdk.services.s3.model.DeleteObjectRequest.builder()
                        .bucket(props.getBucket())
                        .key(media.getS3Key())
                        .build()
        );

        mediaRepository.delete(media);
    }

    private MediaResponse toResponse(CaseMedia media) {
        return new MediaResponse(
                media.getId(),
                media.getCaseId(),
                media.getOriginalName(),
                media.getMimeType(),
                media.getSizeBytes(),
                media.getWidth(),
                media.getHeight(),
                "/api/media/" + media.getId() + "/file",
                media.getCreatedAt()
        );
    }

    private CaseMedia getMedia(UUID mediaId) {
        return mediaRepository.findById(mediaId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Медиа не найдено: " + mediaId
                ));
    }

    private String buildCacheControl() {
        return "public, max-age=" + props.getCacheControlMaxAgeSeconds() + ", immutable";
    }

    private String extractExtension(String filename) {
        if (filename == null) {
            return "";
        }

        int dot = filename.lastIndexOf('.');
        if (dot < 0 || dot == filename.length() - 1) {
            return "";
        }

        return filename.substring(dot + 1).toLowerCase();
    }

    public record MediaFile(
            ResponseInputStream<GetObjectResponse> content,
            String mimeType,
            long sizeBytes,
            String fileName
    ) {
    }
}