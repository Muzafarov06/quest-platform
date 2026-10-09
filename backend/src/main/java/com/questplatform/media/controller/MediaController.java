package com.questplatform.media.controller;

import com.questplatform.media.dto.MediaResponse;
import com.questplatform.media.entity.CaseMedia;
import com.questplatform.media.service.MediaService;
import com.questplatform.users.entity.User;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
public class MediaController {

    private final MediaService mediaService;

    public MediaController(MediaService mediaService) {
        this.mediaService = mediaService;
    }

    /** Получить presigned URL одного медиа по ID. */
    @GetMapping("/api/media/{id}")
    public ResponseEntity<MediaResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(mediaService.getById(id));
    }

    /** Все медиа кейса. */
    @GetMapping("/api/cases/{caseId}/media")
    public ResponseEntity<List<MediaResponse>> listByCase(@PathVariable UUID caseId) {
        return ResponseEntity.ok(mediaService.getByCase(caseId));
    }

    /**
     * Загрузить файл в кейс.
     *
     * <p>Только ADMIN. Обычный пользователь получит 403.</p>
     */
    @PostMapping("/api/admin/cases/{caseId}/media")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MediaResponse> upload(
            @PathVariable UUID caseId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User user
    ) {
        CaseMedia media = mediaService.upload(caseId, file, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(mediaService.getById(media.getId()));
    }

    /**
     * Удалить медиа.
     *
     * <p>Только ADMIN.</p>
     */
    @DeleteMapping("/api/admin/media/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        mediaService.delete(id);
        return ResponseEntity.noContent().build();
    }
}