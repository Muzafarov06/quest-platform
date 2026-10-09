package com.questplatform.admin.service;

import com.questplatform.admin.dto.CreateEvidenceRequest;
import com.questplatform.admin.dto.UpdateEvidenceRequest;
import com.questplatform.cases.repository.CaseRepository;
import com.questplatform.common.exception.BusinessException;
import com.questplatform.common.exception.ResourceNotFoundException;
import com.questplatform.evidences.entity.Evidence;
import com.questplatform.evidences.repository.EvidenceRepository;
import com.questplatform.locations.entity.Location;
import com.questplatform.locations.repository.LocationRepository;
import com.questplatform.objects.entity.GameObject;
import com.questplatform.objects.repository.GameObjectRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class AdminEvidenceService {

    private final EvidenceRepository evidenceRepository;
    private final CaseRepository caseRepository;
    private final GameObjectRepository gameObjectRepository;
    private final LocationRepository locationRepository;

    public AdminEvidenceService(EvidenceRepository evidenceRepository,
                                CaseRepository caseRepository,
                                GameObjectRepository gameObjectRepository,
                                LocationRepository locationRepository) {
        this.evidenceRepository = evidenceRepository;
        this.caseRepository = caseRepository;
        this.gameObjectRepository = gameObjectRepository;
        this.locationRepository = locationRepository;
    }

    @Transactional(readOnly = true)
    public List<Evidence> listByCase(UUID caseId) {
        if (!caseRepository.existsById(caseId)) {
            throw new ResourceNotFoundException("Кейс не найден: " + caseId);
        }
        return evidenceRepository.findByCaseIdOrderBySortOrderAscTitleAsc(caseId);
    }

    @Transactional(readOnly = true)
    public Evidence getById(UUID id) {
        return evidenceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Улика не найдена: " + id));
    }

    @Transactional
    public Evidence create(UUID caseId, CreateEvidenceRequest req) {
        if (!caseRepository.existsById(caseId)) {
            throw new ResourceNotFoundException("Кейс не найден: " + caseId);
        }
        validateLinks(caseId, req.objectId(), req.locationId());

        Evidence e = new Evidence();
        e.setCaseId(caseId);
        e.setTitle(req.title());
        e.setDescription(req.description());
        e.setContentText(req.contentText());
        e.setEvidenceType(req.evidenceType());
        e.setImportance(req.importance());
        e.setObjectId(req.objectId());
        e.setLocationId(req.locationId());
        e.setMediaId(req.mediaId());
        e.setSortOrder(req.sortOrder() != null ? req.sortOrder() : 0);
        return evidenceRepository.save(e);
    }

    @Transactional
    public Evidence update(UUID id, UpdateEvidenceRequest req) {
        Evidence e = getById(id);
        validateLinks(e.getCaseId(), req.objectId(), req.locationId());

        e.setTitle(req.title());
        e.setDescription(req.description());
        e.setContentText(req.contentText());
        e.setEvidenceType(req.evidenceType());
        e.setImportance(req.importance());
        e.setObjectId(req.objectId());
        e.setLocationId(req.locationId());
        e.setMediaId(req.mediaId());
        e.setSortOrder(req.sortOrder());
        return evidenceRepository.save(e);
    }

    @Transactional
    public void delete(UUID id) {
        Evidence e = getById(id);
        evidenceRepository.delete(e);
    }

    /**
     * Проверка: objectId/locationId, если заданы, должны принадлежать тому же кейсу.
     * Это ловит ошибки админки и защищает от кросс-кейсовых связей.
     */
    private void validateLinks(UUID caseId, UUID objectId, UUID locationId) {
        if (objectId != null) {
            GameObject obj = gameObjectRepository.findById(objectId)
                    .orElseThrow(() -> new ResourceNotFoundException("Объект не найден: " + objectId));
            Location loc = locationRepository.findById(obj.getLocationId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Локация объекта не найдена: " + obj.getLocationId()));
            if (!loc.getCaseId().equals(caseId)) {
                throw new BusinessException(
                        "Объект принадлежит другому кейсу",
                        HttpStatus.BAD_REQUEST);
            }
        }
        if (locationId != null) {
            Location loc = locationRepository.findById(locationId)
                    .orElseThrow(() -> new ResourceNotFoundException("Локация не найдена: " + locationId));
            if (!loc.getCaseId().equals(caseId)) {
                throw new BusinessException(
                        "Локация принадлежит другому кейсу",
                        HttpStatus.BAD_REQUEST);
            }
        }
    }
}