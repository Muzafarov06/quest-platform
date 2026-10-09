package com.questplatform.figures.controller;

import com.questplatform.figures.dto.FigureResponse;
import com.questplatform.figures.service.FigureService;
import com.questplatform.users.entity.User;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/figures")
@PreAuthorize("hasRole('ADMIN')")
public class AdminFigureController {

    private final FigureService figureService;

    public AdminFigureController(FigureService figureService) {
        this.figureService = figureService;
    }

    @GetMapping
    public ResponseEntity<List<FigureResponse>> listAll() {
        return ResponseEntity.ok(figureService.listAll());
    }

    /**
     * Создать фигурку. Multipart: label + fallbackEmoji + sortOrder + file.
     * Файл не обязателен.
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<FigureResponse> create(
            @RequestParam("label") String label,
            @RequestParam(value = "fallbackEmoji", required = false) String fallbackEmoji,
            @RequestParam(value = "sortOrder", required = false) Integer sortOrder,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @AuthenticationPrincipal User user
    ) {
        FigureResponse created = figureService.create(label, fallbackEmoji, sortOrder, file, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PatchMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<FigureResponse> update(
            @PathVariable UUID id,
            @RequestParam(value = "label", required = false) String label,
            @RequestParam(value = "fallbackEmoji", required = false) String fallbackEmoji,
            @RequestParam(value = "sortOrder", required = false) Integer sortOrder,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(figureService.update(id, label, fallbackEmoji, sortOrder, file, user));
    }

    @PatchMapping("/{id}/active")
    public ResponseEntity<FigureResponse> toggleActive(
            @PathVariable UUID id,
            @RequestParam("active") boolean active
    ) {
        return ResponseEntity.ok(figureService.toggleActive(id, active));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        figureService.delete(id);
        return ResponseEntity.noContent().build();
    }
}