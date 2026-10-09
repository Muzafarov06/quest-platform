package com.questplatform.evidences.service;

import com.questplatform.evidences.entity.Evidence;
import com.questplatform.cases.repository.CaseRepository;
import com.questplatform.evidences.repository.EvidenceRepository;
import com.questplatform.objects.repository.GameObjectRepository;
import com.questplatform.locations.repository.LocationRepository;
import com.questplatform.common.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class EvidenceService {

    private final EvidenceRepository evidenceRepository;
    private final CaseRepository caseRepository;
    private final GameObjectRepository gameObjectRepository;
    private final LocationRepository locationRepository;

    public EvidenceService(EvidenceRepository evidenceRepository,
                           CaseRepository caseRepository,
                           GameObjectRepository gameObjectRepository,
                           LocationRepository locationRepository) {
        this.evidenceRepository = evidenceRepository;
        this.caseRepository = caseRepository;
        this.gameObjectRepository = gameObjectRepository;
        this.locationRepository = locationRepository;
    }

    @Transactional(readOnly = true)
    public List<Evidence> getByCaseId(UUID caseId) {
        if (!caseRepository.existsById(caseId)) {
            throw new ResourceNotFoundException("Кейс не найден: " + caseId);
        }
        return evidenceRepository.findByCaseIdOrderBySortOrderAscTitleAsc(caseId);
    }

    @Transactional(readOnly = true)
    public List<Evidence> getByObjectId(UUID objectId) {
        if (!gameObjectRepository.existsById(objectId)) {
            throw new ResourceNotFoundException("Объект не найден: " + objectId);
        }
        return evidenceRepository.findByObjectIdOrderBySortOrderAscTitleAsc(objectId);
    }

    /**
     * Улики, привязанные к локации напрямую. 404 если локации нет.
     */
    @Transactional(readOnly = true)
    public List<Evidence> getByLocationId(UUID locationId) {
        if (!locationRepository.existsById(locationId)) {
            throw new ResourceNotFoundException("Локация не найдена: " + locationId);
        }
        return evidenceRepository.findByLocationIdOrderBySortOrderAscTitleAsc(locationId);
    }

    @Transactional(readOnly = true)
    public Evidence getById(UUID id) {
        return evidenceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Улика не найдена: " + id));
    }
}