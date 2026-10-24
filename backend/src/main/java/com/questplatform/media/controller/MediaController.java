package com.questplatform.media.controller;

import com.questplatform.media.dto.MediaResponse;
import com.questplatform.media.dto.PresignUploadRequest;
import com.questplatform.media.dto.PresignUploadResponse;
import com.questplatform.media.entity.CaseMedia;
import com.questplatform.media.service.MediaService;
import com.questplatform.users.entity.User;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.io.InputStream;
import java.util.List;
import java.util.UUID;

@RestController
public class MediaController {

    private final MediaService mediaService;

    public MediaController(MediaService mediaService) {
        this.mediaService = mediaService;
    }

    @GetMapping("/api/media/{id}")
    public ResponseEntity<MediaResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(mediaService.getById(id));
    }

    /**
     * Отдаёт файл браузеру через backend.
     * Именно этот URL теперь используется в <img src="...">.
     */
    @GetMapping("/api/media/{id}/file")
    public ResponseEntity<StreamingResponseBody> getFile(@PathVariable UUID id) {
        MediaService.MediaFile file = mediaService.getFile(id);

        StreamingResponseBody body = outputStream -> {
            try (InputStream input = file.content()) {
                input.transferTo(outputStream);
            }
        };

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(file.mimeType()))
                .contentLength(file.sizeBytes())
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=31536000, immutable")
                .body(body);
    }

    @GetMapping("/api/cases/{caseId}/media")
    public ResponseEntity<List<MediaResponse>> listByCase(@PathVariable UUID caseId) {
        return ResponseEntity.ok(mediaService.getByCase(caseId));
    }

    @PostMapping("/api/admin/media/presign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PresignUploadResponse> presignUpload(
            @Valid @RequestBody PresignUploadRequest request,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(mediaService.createPresignedUpload(request, user));
    }

    @PostMapping("/api/admin/cases/{caseId}/media")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MediaResponse> upload(
            @PathVariable UUID caseId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User user
    ) {
        CaseMedia media = mediaService.upload(caseId, file, user);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(mediaService.getById(media.getId()));
    }

    @DeleteMapping("/api/admin/media/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        mediaService.delete(id);
        return ResponseEntity.noContent().build();
    }
}