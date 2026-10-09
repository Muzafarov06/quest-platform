package com.questplatform.objects.service;

import com.questplatform.objects.entity.GameObject;
import com.questplatform.objects.repository.GameObjectRepository;
import com.questplatform.locations.repository.LocationRepository;
import com.questplatform.common.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class GameObjectService {

    private final GameObjectRepository gameObjectRepository;
    private final LocationRepository locationRepository;

    public GameObjectService(GameObjectRepository gameObjectRepository, LocationRepository locationRepository) {
        this.gameObjectRepository = gameObjectRepository;
        this.locationRepository = locationRepository;
    }

    /**
     * Объекты в локации.
     * 404 если локация не существует.
     */
    @Transactional(readOnly = true)
    public List<GameObject> getByLocationId(UUID locationId) {
        if (!locationRepository.existsById(locationId)) {
            throw new ResourceNotFoundException("Локация не найдена: " + locationId);
        }
        return gameObjectRepository.findByLocationIdOrderBySortOrderAscNameAsc(locationId);
    }

    /**
     * Объект по ID. 404 если не найден.
     */
    @Transactional(readOnly = true)
    public GameObject getById(UUID id) {
        return gameObjectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Объект не найден: " + id));
    }
}