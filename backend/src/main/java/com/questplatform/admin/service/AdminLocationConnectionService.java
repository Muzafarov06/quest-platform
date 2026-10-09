package com.questplatform.admin.service;

import com.questplatform.admin.dto.CreateConnectionRequest;
import com.questplatform.admin.dto.UpdateConnectionRequest;
import com.questplatform.common.exception.BusinessException;
import com.questplatform.common.exception.ResourceNotFoundException;
import com.questplatform.locations.entity.Location;
import com.questplatform.locations.entity.LocationConnection;
import com.questplatform.locations.repository.LocationConnectionRepository;
import com.questplatform.locations.repository.LocationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class AdminLocationConnectionService {

    private final LocationConnectionRepository connectionRepository;
    private final LocationRepository locationRepository;

    public AdminLocationConnectionService(LocationConnectionRepository connectionRepository,
                                          LocationRepository locationRepository) {
        this.connectionRepository = connectionRepository;
        this.locationRepository = locationRepository;
    }

    @Transactional(readOnly = true)
    public List<LocationConnection> getFrom(UUID fromLocationId) {
        if (!locationRepository.existsById(fromLocationId)) {
            throw new ResourceNotFoundException("Локация не найдена: " + fromLocationId);
        }
        return connectionRepository.findByFromLocationIdOrderBySortOrderAscIdAsc(fromLocationId);
    }

    @Transactional
    public LocationConnection create(UUID fromLocationId, CreateConnectionRequest req) {
        Location from = locationRepository.findById(fromLocationId)
                .orElseThrow(() -> new ResourceNotFoundException("Локация не найдена: " + fromLocationId));
        Location to = locationRepository.findById(req.toLocationId())
                .orElseThrow(() -> new ResourceNotFoundException("Целевая локация не найдена: " + req.toLocationId()));

        if (!from.getCaseId().equals(to.getCaseId())) {
            throw new BusinessException("Локации из разных кейсов", HttpStatus.BAD_REQUEST);
        }
        if (fromLocationId.equals(req.toLocationId())) {
            throw new BusinessException("Переход в себя невозможен", HttpStatus.BAD_REQUEST);
        }
        if (connectionRepository.existsByFromLocationIdAndToLocationId(fromLocationId, req.toLocationId())) {
            throw new BusinessException("Такой переход уже существует", HttpStatus.CONFLICT);
        }

        LocationConnection c = new LocationConnection();
        c.setCaseId(from.getCaseId());
        c.setFromLocationId(fromLocationId);
        c.setToLocationId(req.toLocationId());
        c.setLabel(req.label());
        c.setSortOrder(req.sortOrder() != null ? req.sortOrder() : 0);
        return connectionRepository.save(c);
    }

    /**
     * Обновить переход: label, sortOrder, координаты зоны на сцене.
     * {@code posX}/{@code posY} = null → снять со сцены.
     */
    @Transactional
    public LocationConnection update(UUID id, UpdateConnectionRequest req) {
        LocationConnection c = connectionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Переход не найден: " + id));

        if (req.label() != null) c.setLabel(req.label());
        if (req.sortOrder() != null) c.setSortOrder(req.sortOrder());

        c.setPosX(req.posX());
        c.setPosY(req.posY());

        return connectionRepository.save(c);
    }

    @Transactional
    public void delete(UUID id) {
        LocationConnection c = connectionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Переход не найден: " + id));
        connectionRepository.delete(c);
    }
}