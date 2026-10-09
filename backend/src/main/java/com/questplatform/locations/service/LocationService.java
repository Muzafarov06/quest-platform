package com.questplatform.locations.service;

import com.questplatform.locations.entity.Location;
import com.questplatform.cases.repository.CaseRepository;
import com.questplatform.locations.repository.LocationRepository;
import com.questplatform.common.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class LocationService {

    private final LocationRepository locationRepository;
    private final CaseRepository caseRepository;

    public LocationService(LocationRepository locationRepository, CaseRepository caseRepository) {
        this.locationRepository = locationRepository;
        this.caseRepository = caseRepository;
    }

    /**
     * Все локации кейса.
     *
     * <p>Проверяет, что кейс существует. Если нет — 404.</p>
     */
    @Transactional(readOnly = true)
    public List<Location> getByCaseId(UUID caseId) {
        if (!caseRepository.existsById(caseId)) {
            throw new ResourceNotFoundException("Кейс не найден: " + caseId);
        }
        return locationRepository.findByCaseIdOrderBySortOrderAscNameAsc(caseId);
    }

    /**
     * Локация по ID. Если не найдена — 404.
     */
    @Transactional(readOnly = true)
    public Location getById(UUID id) {
        return locationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Локация не найдена: " + id));
    }
}