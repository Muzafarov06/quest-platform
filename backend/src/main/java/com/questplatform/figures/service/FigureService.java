package com.questplatform.figures.service;

import com.questplatform.common.exception.BusinessException;
import com.questplatform.common.exception.ResourceNotFoundException;
import com.questplatform.figures.dto.FigureResponse;
import com.questplatform.figures.entity.Figure;
import com.questplatform.figures.mapper.FigureMapper;
import com.questplatform.figures.repository.FigureRepository;
import com.questplatform.media.entity.CaseMedia;
import com.questplatform.media.service.MediaService;
import com.questplatform.users.entity.User;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Service
public class FigureService {

    private final FigureRepository figureRepository;
    private final FigureMapper mapper;
    private final MediaService mediaService;

    public FigureService(FigureRepository figureRepository,
                         FigureMapper mapper,
                         MediaService mediaService) {
        this.figureRepository = figureRepository;
        this.mapper = mapper;
        this.mediaService = mediaService;
    }

    /* ---------- Public ---------- */

    @Transactional(readOnly = true)
    public List<FigureResponse> listActive() {
        return mapper.toResponseList(figureRepository.findByActiveTrueOrderBySortOrderAscCreatedAtAsc());
    }

    /* ---------- Admin ---------- */

    @Transactional(readOnly = true)
    public List<FigureResponse> listAll() {
        return mapper.toResponseList(figureRepository.findAllByOrderBySortOrderAscCreatedAtAsc());
    }

    /**
     * Создать фигурку.
     *
     * <p>{@code file} не обязателен — можно создать фигурку только
     * с эмодзи, без PNG. Если файл передан — он загружается в S3.</p>
     */
    @Transactional
    public FigureResponse create(String label,
                                 String fallbackEmoji,
                                 Integer sortOrder,
                                 MultipartFile file,
                                 User user) {
        if (label == null || label.isBlank()) {
            throw new BusinessException("Название обязательно", HttpStatus.BAD_REQUEST);
        }

        Figure f = new Figure();
        f.setCode(generateNextCode());
        f.setLabel(label.trim());
        f.setFallbackEmoji(normalizeEmoji(fallbackEmoji));
        f.setSortOrder(sortOrder != null ? sortOrder : 0);

        if (file != null && !file.isEmpty()) {
            CaseMedia media = mediaService.upload(null, file, user);
            f.setMediaId(media.getId());
        }

        Figure saved = figureRepository.save(f);
        return mapper.toResponse(saved);
    }

    @Transactional
    public FigureResponse update(UUID id,
                                 String label,
                                 String fallbackEmoji,
                                 Integer sortOrder,
                                 MultipartFile file,
                                 User user) {
        Figure f = figureRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Фигурка не найдена: " + id));

        if (label != null && !label.isBlank()) f.setLabel(label.trim());
        if (fallbackEmoji != null) f.setFallbackEmoji(normalizeEmoji(fallbackEmoji));
        if (sortOrder != null) f.setSortOrder(sortOrder);

        if (file != null && !file.isEmpty()) {
            CaseMedia media = mediaService.upload(null, file, user);
            f.setMediaId(media.getId());
        }

        Figure saved = figureRepository.save(f);
        return mapper.toResponse(saved);
    }

    @Transactional
    public FigureResponse toggleActive(UUID id, boolean active) {
        Figure f = figureRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Фигурка не найдена: " + id));
        f.setActive(active);
        return mapper.toResponse(figureRepository.save(f));
    }

    @Transactional
    public void delete(UUID id) {
        Figure f = figureRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Фигурка не найдена: " + id));
        figureRepository.delete(f);
    }

    /* ---------- Helpers ---------- */

    private String normalizeEmoji(String emoji) {
        if (emoji == null || emoji.isBlank()) return "🕵️";
        String trimmed = emoji.trim();
        return trimmed.length() > 10 ? trimmed.substring(0, 10) : trimmed;
    }

    /**
     * Генерирует следующий свободный код figure-NNN.
     */
    private String generateNextCode() {
        int n = 1;
        while (n < 10_000) {
            String candidate = String.format("figure-%03d", n);
            if (!figureRepository.existsByCode(candidate)) {
                return candidate;
            }
            n++;
        }
        throw new BusinessException("Не удалось сгенерировать код фигурки", HttpStatus.INTERNAL_SERVER_ERROR);
    }
}