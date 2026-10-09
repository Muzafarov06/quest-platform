package com.questplatform.admin.service;

import com.questplatform.admin.dto.CaseDeleteInfo;
import com.questplatform.admin.dto.CreateCaseRequest;
import com.questplatform.admin.dto.UpdateCaseRequest;
import com.questplatform.cases.domain.CaseStatus;
import com.questplatform.cases.entity.Case;
import com.questplatform.cases.repository.CaseRepository;
import com.questplatform.common.exception.BusinessException;
import com.questplatform.common.exception.CaseCodeAlreadyExistsException;
import com.questplatform.common.exception.PublishValidationException;
import com.questplatform.common.exception.ResourceNotFoundException;
import com.questplatform.engine.repository.CharacterRepository;
import com.questplatform.evidences.repository.EvidenceRepository;
import com.questplatform.locations.repository.LocationRepository;
import com.questplatform.sessions.repository.GameSessionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Сервис админских операций над кейсами.
 */
@Service
public class AdminCaseService {

    private final CaseRepository caseRepository;
    private final LocationRepository locationRepository;
    private final EvidenceRepository evidenceRepository;
    private final CharacterRepository characterRepository;
    private final GameSessionRepository sessionRepository;

    public AdminCaseService(CaseRepository caseRepository,
                            LocationRepository locationRepository,
                            EvidenceRepository evidenceRepository,
                            CharacterRepository characterRepository,
                            GameSessionRepository sessionRepository) {
        this.caseRepository = caseRepository;
        this.locationRepository = locationRepository;
        this.evidenceRepository = evidenceRepository;
        this.characterRepository = characterRepository;
        this.sessionRepository = sessionRepository;
    }

    @Transactional(readOnly = true)
    public List<Case> getAllCases() {
        return caseRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public Case getById(UUID id) {
        return caseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Кейс не найден: " + id));
    }

    @Transactional
    public Case createCase(CreateCaseRequest req, UUID createdBy) {
        if (caseRepository.existsByCode(req.code())) {
            throw new CaseCodeAlreadyExistsException(req.code());
        }

        Case c = new Case();
        c.setCode(req.code());
        c.setTitle(req.title());
        c.setDescription(req.description());
        c.setGenre(req.genre());
        c.setAgeLimit(req.ageLimit() != null ? req.ageLimit() : (short) 16);
        c.setMinPlayers(req.minPlayers() != null ? req.minPlayers() : (short) 1);
        c.setMaxPlayers(req.maxPlayers() != null ? req.maxPlayers() : (short) 10);
        c.setDurationMinutes(req.durationMinutes());
        c.setPriceCents(req.priceCents() != null ? req.priceCents() : 0);
        c.setStatus(CaseStatus.DRAFT);
        c.setCreatedBy(createdBy);

        validatePlayersRange(c.getMinPlayers(), c.getMaxPlayers());

        return caseRepository.save(c);
    }

    @Transactional
    public Case updateCase(UUID id, UpdateCaseRequest req) {
        Case c = getById(id);

        /* Паттерн "partial update": меняем только то, что пришло. */
        if (req.title() != null) c.setTitle(req.title());
        if (req.description() != null) c.setDescription(req.description());
        if (req.genre() != null) c.setGenre(req.genre());
        if (req.ageLimit() != null) c.setAgeLimit(req.ageLimit());
        if (req.minPlayers() != null) c.setMinPlayers(req.minPlayers());
        if (req.maxPlayers() != null) c.setMaxPlayers(req.maxPlayers());
        if (req.durationMinutes() != null) c.setDurationMinutes(req.durationMinutes());
        if (req.priceCents() != null) c.setPriceCents(req.priceCents());
        if (req.coverMediaId() != null) c.setCoverMediaId(req.coverMediaId());
        if (req.mapMediaId() != null) c.setMapMediaId(req.mapMediaId());
        if (req.entryLocationId() != null) c.setEntryLocationId(req.entryLocationId());
        if (req.mapWidth() != null) c.setMapWidth(req.mapWidth());
        if (req.mapHeight() != null) c.setMapHeight(req.mapHeight());

        validatePlayersRange(c.getMinPlayers(), c.getMaxPlayers());

        return caseRepository.save(c);
    }

    @Transactional
    public Case publish(UUID caseId) {
        Case c = getById(caseId);

        if (c.getStatus() == CaseStatus.PUBLISHED) {
            throw new BusinessException("Кейс уже опубликован", HttpStatus.CONFLICT);
        }
        if (c.getStatus() == CaseStatus.ARCHIVED) {
            throw new BusinessException("Архивный кейс нельзя опубликовать", HttpStatus.CONFLICT);
        }

        List<String> reasons = new ArrayList<>();
        if (!locationRepository.existsByCaseId(caseId)) {
            reasons.add("Нужна хотя бы одна локация");
        }
        if (!reasons.isEmpty()) {
            throw new PublishValidationException(reasons);
        }

        c.setStatus(CaseStatus.PUBLISHED);
        return caseRepository.save(c);
    }

    /**
     * Сгенерировать следующий свободный код вида CASE-NNN.
     *
     * <p>Идём от CASE-001 вверх, ищем первый незанятый. Хватает до 9999 кейсов.</p>
     */
    @Transactional(readOnly = true)
    public String generateNextCode() {
        int n = 1;
        while (n < 10_000) {
            String candidate = String.format("CASE-%03d", n);
            if (!caseRepository.existsByCode(candidate)) {
                return candidate;
            }
            n++;
        }
        throw new BusinessException(
                "Не удалось сгенерировать код: закончились свободные номера",
                HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @Transactional
    public Case unpublish(UUID caseId) {
        Case c = getById(caseId);
        if (c.getStatus() != CaseStatus.PUBLISHED) {
            throw new BusinessException("Кейс не опубликован", HttpStatus.CONFLICT);
        }
        c.setStatus(CaseStatus.DRAFT);
        return caseRepository.save(c);
    }

    /**
     * Информация о зависимостях кейса перед удалением.
     * Что удалится каскадом, что помешает удалению.
     */
    @Transactional(readOnly = true)
    public CaseDeleteInfo getDeleteInfo(UUID caseId) {
        Case c = getById(caseId);

        long locations = locationRepository
                .findByCaseIdOrderBySortOrderAscNameAsc(caseId).size();
        long evidences = evidenceRepository
                .findByCaseIdOrderBySortOrderAscTitleAsc(caseId).size();
        long characters = characterRepository
                .findByCaseIdOrderBySortOrderAscNameAsc(caseId).size();

        /* Все сессии кейса — любые статусы. Если они есть, удалять нельзя. */
        long sessions = sessionRepository
                .findByCaseIdOrderByCreatedAtDesc(caseId).size();

        return new CaseDeleteInfo(
                c.getId(),
                c.getCode(),
                c.getTitle(),
                c.getStatus().name(),
                locations,
                evidences,
                characters,
                sessions
        );
    }

    /**
     * Удалить кейс.
     *
     * <p>Блокируется, если есть сессии: game_sessions.case_id имеет
     * ON DELETE RESTRICT. Сначала нужно удалить все сессии кейса.</p>
     *
     * <p>Всё остальное (локации, объекты, улики, персонажи, события,
     * медиа-ссылки) удалится каскадом по FK.</p>
     */
    @Transactional
    public void deleteCase(UUID caseId) {
        Case c = getById(caseId);

        long sessions = sessionRepository
                .findByCaseIdOrderByCreatedAtDesc(caseId).size();
        if (sessions > 0) {
            throw new BusinessException(
                    "Нельзя удалить: у кейса " + sessions
                            + " сессий. Сначала удалите все сессии в «Моих расследованиях».",
                    HttpStatus.CONFLICT);
        }

        caseRepository.delete(c);
    }

    private void validatePlayersRange(Short min, Short max) {
        if (min != null && max != null && max < min) {
            throw new BusinessException(
                    "maxPlayers не может быть меньше minPlayers",
                    HttpStatus.BAD_REQUEST);
        }
    }
}