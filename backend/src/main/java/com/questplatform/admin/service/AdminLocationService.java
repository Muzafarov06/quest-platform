package com.questplatform.admin.service;

import com.questplatform.admin.dto.CreateLocationRequest;
import com.questplatform.admin.dto.DeleteInfoResponse;
import com.questplatform.admin.dto.UpdateLocationRequest;
import com.questplatform.cases.repository.CaseRepository;
import com.questplatform.common.exception.BusinessException;
import com.questplatform.common.exception.ResourceNotFoundException;
import com.questplatform.evidences.repository.EvidenceRepository;
import com.questplatform.locations.domain.DiscoveryMode;
import com.questplatform.locations.entity.Location;
import com.questplatform.locations.repository.LocationConnectionRepository;
import com.questplatform.locations.repository.LocationRepository;
import com.questplatform.objects.repository.GameObjectRepository;
import com.questplatform.sessions.domain.SessionStatus;
import com.questplatform.sessions.repository.GameSessionRepository;
import com.questplatform.sessions.repository.SessionUnlockedLocationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class AdminLocationService {

    private final LocationRepository locationRepository;
    private final LocationConnectionRepository connectionRepository;
    private final CaseRepository caseRepository;
    private final GameObjectRepository gameObjectRepository;
    private final EvidenceRepository evidenceRepository;
    private final GameSessionRepository sessionRepository;
    private final SessionUnlockedLocationRepository unlockedRepository;

    public AdminLocationService(LocationRepository locationRepository,
                                LocationConnectionRepository connectionRepository,
                                CaseRepository caseRepository,
                                GameObjectRepository gameObjectRepository,
                                EvidenceRepository evidenceRepository,
                                GameSessionRepository sessionRepository,
                                SessionUnlockedLocationRepository unlockedRepository) {
        this.locationRepository = locationRepository;
        this.connectionRepository = connectionRepository;
        this.caseRepository = caseRepository;
        this.gameObjectRepository = gameObjectRepository;
        this.evidenceRepository = evidenceRepository;
        this.sessionRepository = sessionRepository;
        this.unlockedRepository = unlockedRepository;
    }

    @Transactional(readOnly = true)
    public List<Location> getByCaseId(UUID caseId) {
        if (!caseRepository.existsById(caseId)) {
            throw new ResourceNotFoundException("Кейс не найден: " + caseId);
        }
        return locationRepository.findByCaseIdOrderBySortOrderAscNameAsc(caseId);
    }

    @Transactional(readOnly = true)
    public Location getById(UUID id) {
        return locationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Локация не найдена: " + id));
    }

    @Transactional
    public Location create(UUID caseId, CreateLocationRequest req) {
        if (!caseRepository.existsById(caseId)) {
            throw new ResourceNotFoundException("Кейс не найден: " + caseId);
        }
        if (req.parentId() != null) {
            Location parent = getById(req.parentId());
            if (!parent.getCaseId().equals(caseId)) {
                throw new BusinessException(
                        "Родительская локация из другого кейса",
                        HttpStatus.BAD_REQUEST);
            }
        }

        Location l = new Location();
        l.setCaseId(caseId);
        l.setName(req.name());
        l.setDescription(req.description());
        l.setLocationType(req.locationType());
        l.setParentId(req.parentId());
        l.setMediaId(req.mediaId());
        l.setPreviewMediaId(req.previewMediaId());
        l.setMapMediaId(req.mapMediaId());
        l.setSortOrder(req.sortOrder() != null ? req.sortOrder() : 0);

        if (req.discoveryMode() != null) l.setDiscoveryMode(req.discoveryMode());
        l.setDiscoveryTargetId(req.discoveryTargetId());
        l.setDiscoveryHint(req.discoveryHint());

        return locationRepository.save(l);
    }

    @Transactional
    public Location update(UUID id, UpdateLocationRequest req) {
        Location l = getById(id);

        if (req.parentId() != null) {
            if (req.parentId().equals(id)) {
                throw new BusinessException(
                        "Локация не может быть родителем себе",
                        HttpStatus.BAD_REQUEST);
            }
            Location parent = getById(req.parentId());
            if (!parent.getCaseId().equals(l.getCaseId())) {
                throw new BusinessException(
                        "Родительская локация из другого кейса",
                        HttpStatus.BAD_REQUEST);
            }
        }

        l.setName(req.name());
        l.setDescription(req.description());
        l.setLocationType(req.locationType());
        l.setParentId(req.parentId());
        l.setMediaId(req.mediaId());
        l.setPreviewMediaId(req.previewMediaId());
        l.setMapMediaId(req.mapMediaId());
        l.setSortOrder(req.sortOrder());

        if (req.entryX() != null) l.setEntryX(req.entryX());
        if (req.entryY() != null) l.setEntryY(req.entryY());

        if (req.discoveryMode() != null) l.setDiscoveryMode(req.discoveryMode());
        if (req.discoveryTargetId() != null || req.discoveryMode() == DiscoveryMode.ALWAYS) {
            l.setDiscoveryTargetId(req.discoveryTargetId());
        }
        if (req.discoveryHint() != null) l.setDiscoveryHint(req.discoveryHint());

        if (req.sceneScale() != null) l.setSceneScale(clampScale(req.sceneScale()));
        if (req.sceneRotation() != null) l.setSceneRotation(normalizeRotation(req.sceneRotation()));

        return locationRepository.save(l);
    }

    @Transactional
    public Location updateTransform(UUID id, Float posX, Float posY,
                                    Float scale, Float rotation) {
        Location l = getById(id);

        if (l.getParentId() != null) {
            /* Под-локация на сцене родителя: пишем в entry_x/entry_y. */
            if (posX != null) l.setEntryX(posX);
            if (posY != null) l.setEntryY(posY);
        } else {
            /* Корневая локация на карте дела: пишем в map_x/map_y. */
            if (posX != null) l.setMapX(Math.round(posX));
            if (posY != null) l.setMapY(Math.round(posY));
        }

        if (scale != null) l.setSceneScale(clampScale(scale));
        if (rotation != null) l.setSceneRotation(normalizeRotation(rotation));

        return locationRepository.save(l);
    }

    @Transactional
    public Location updateMapPosition(UUID id, int mapX, int mapY) {
        Location l = getById(id);
        l.setMapX(mapX);
        l.setMapY(mapY);
        return locationRepository.save(l);
    }

    /**
     * Информация о зависимостях локации — что удалится вместе с ней.
     * Используется в модалке удаления.
     */
    @Transactional(readOnly = true)
    public DeleteInfoResponse getDeleteInfo(UUID id) {
        Location l = getById(id);

        List<Location> children = locationRepository
                .findByParentIdOrderBySortOrderAscNameAsc(id);
        long objects = gameObjectRepository.findByLocationIdOrderBySortOrderAscNameAsc(id).size();
        long evidenceByLocation = evidenceRepository
                .findByLocationIdOrderBySortOrderAscTitleAsc(id).size();
        long connections = connectionRepository
                .findByFromLocationIdOrderBySortOrderAscIdAsc(id).size()
                + connectionRepository.findByCaseIdOrderBySortOrderAscIdAsc(l.getCaseId())
                .stream()
                .filter(c -> c.getToLocationId().equals(id))
                .count();

        long activeSessions = sessionRepository
                .findByCaseIdAndStatus(l.getCaseId(), SessionStatus.ACTIVE)
                .stream()
                .filter(s -> unlockedRepository.existsBySessionIdAndLocationId(s.getId(), id))
                .count();

        /* Была ли локация стартовой в кейсе. */
        boolean isEntry = caseRepository.findById(l.getCaseId())
                .map(c -> id.equals(c.getEntryLocationId()))
                .orElse(false);

        return new DeleteInfoResponse(
                id,
                l.getName(),
                children.size(),
                children.stream().map(Location::getName).toList(),
                objects,
                evidenceByLocation,
                connections,
                activeSessions,
                isEntry
        );
    }

    /**
     * Удалить локацию со всем каскадом.
     *
     * Блокируется, если:
     *   • есть дочерние локации;
     *   • локация открыта в активной сессии;
     *   • локация — стартовая в кейсе.
     */
    @Transactional
    public void delete(UUID id) {
        Location l = getById(id);

        List<Location> children = locationRepository
                .findByParentIdOrderBySortOrderAscNameAsc(id);
        if (!children.isEmpty()) {
            throw new BusinessException(
                    "Нельзя удалить: есть вложенные локации (" + children.size() + "). " +
                            "Удалите или переназначьте их сначала.",
                    HttpStatus.CONFLICT);
        }

        boolean isEntry = caseRepository.findById(l.getCaseId())
                .map(c -> id.equals(c.getEntryLocationId()))
                .orElse(false);
        if (isEntry) {
            throw new BusinessException(
                    "Это стартовая локация кейса. Сначала смените стартовую локацию на карте дела.",
                    HttpStatus.CONFLICT);
        }

        long activeSessions = sessionRepository
                .findByCaseIdAndStatus(l.getCaseId(), SessionStatus.ACTIVE)
                .stream()
                .filter(s -> unlockedRepository.existsBySessionIdAndLocationId(s.getId(), id))
                .count();
        if (activeSessions > 0) {
            throw new BusinessException(
                    "Локация открыта в активной сессии (" + activeSessions + "). " +
                            "Завершите сессии или закройте локацию.",
                    HttpStatus.CONFLICT);
        }

        /* Улики, привязанные к локации, — обнулим location_id, чтобы не потерять.
           Улики через объекты удалятся каскадом, потому что game_objects — CASCADE. */
        evidenceRepository.findByLocationIdOrderBySortOrderAscTitleAsc(id)
                .forEach(e -> {
                    e.setLocationId(null);
                    evidenceRepository.save(e);
                });

        /* Связи: удаляем исходящие и входящие. */
        connectionRepository.findByFromLocationIdOrderBySortOrderAscIdAsc(id)
                .forEach(connectionRepository::delete);
        connectionRepository.findByCaseIdOrderBySortOrderAscIdAsc(l.getCaseId())
                .stream()
                .filter(c -> c.getToLocationId().equals(id))
                .forEach(connectionRepository::delete);

        /* Объекты удалятся каскадом через FK game_objects.location_id. */

        locationRepository.delete(l);
    }

    private static float clampScale(float s) {
        if (s < 0.1f) return 0.1f;
        if (s > 10f) return 10f;
        return s;
    }

    private static float normalizeRotation(float r) {
        while (r > 180f) r -= 360f;
        while (r < -180f) r += 360f;
        return r;
    }
}