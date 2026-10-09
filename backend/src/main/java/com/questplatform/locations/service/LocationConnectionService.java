package com.questplatform.locations.service;

import com.questplatform.locations.entity.LocationConnection;
import com.questplatform.locations.repository.LocationConnectionRepository;
import com.questplatform.locations.repository.LocationRepository;
import com.questplatform.common.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class LocationConnectionService {

    private final LocationConnectionRepository connectionRepository;
    private final LocationRepository locationRepository;

    public LocationConnectionService(LocationConnectionRepository connectionRepository,
                                     LocationRepository locationRepository) {
        this.connectionRepository = connectionRepository;
        this.locationRepository = locationRepository;
    }

    /**
     * Исходящие переходы из локации. 404 если локации нет.
     */
    @Transactional(readOnly = true)
    public List<LocationConnection> getByFromLocationId(UUID fromLocationId) {
        if (!locationRepository.existsById(fromLocationId)) {
            throw new ResourceNotFoundException("Локация не найдена: " + fromLocationId);
        }
        return connectionRepository.findByFromLocationIdOrderBySortOrderAscIdAsc(fromLocationId);
    }
}