package com.questplatform.evidences.mapper;

import com.questplatform.evidences.dto.EvidenceResponse;
import com.questplatform.evidences.entity.Evidence;
import com.questplatform.objects.entity.GameObject;
import com.questplatform.locations.entity.Location;
import com.questplatform.objects.repository.GameObjectRepository;
import com.questplatform.locations.repository.LocationRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class EvidenceMapper {

    private final GameObjectRepository gameObjectRepository;
    private final LocationRepository locationRepository;

    public EvidenceMapper(GameObjectRepository gameObjectRepository,
                          LocationRepository locationRepository) {
        this.gameObjectRepository = gameObjectRepository;
        this.locationRepository = locationRepository;
    }

    /**
     * Маппинг списка улик с batch-загрузкой имён объектов и локаций.
     * Один SELECT на все объекты, один на все локации — не N+1.
     */
    public List<EvidenceResponse> toResponseList(List<Evidence> evidences) {
        if (evidences == null || evidences.isEmpty()) {
            return List.of();
        }

        Set<UUID> objectIds = evidences.stream()
                .map(Evidence::getObjectId)
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toSet());

        Set<UUID> locationIds = evidences.stream()
                .map(Evidence::getLocationId)
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toSet());

        Map<UUID, String> objectNames = objectIds.isEmpty()
                ? Map.of()
                : gameObjectRepository.findAllById(objectIds).stream()
                .collect(Collectors.toMap(GameObject::getId, GameObject::getName));

        Map<UUID, String> locationNames = locationIds.isEmpty()
                ? Map.of()
                : locationRepository.findAllById(locationIds).stream()
                .collect(Collectors.toMap(Location::getId, Location::getName));

        return evidences.stream()
                .map(e -> toResponse(e, objectNames, locationNames))
                .toList();
    }

    /**
     * Маппинг одиночной улики. Загружает имена — 2 запроса.
     */
    public EvidenceResponse toResponse(Evidence e) {
        if (e == null) {
            return null;
        }
        String objectName = e.getObjectId() != null
                ? gameObjectRepository.findById(e.getObjectId()).map(GameObject::getName).orElse(null)
                : null;
        String locationName = e.getLocationId() != null
                ? locationRepository.findById(e.getLocationId()).map(Location::getName).orElse(null)
                : null;
        return toResponse(e,
                objectName != null ? Map.of(e.getObjectId(), objectName) : Map.of(),
                locationName != null ? Map.of(e.getLocationId(), locationName) : Map.of());
    }

    private EvidenceResponse toResponse(Evidence e, Map<UUID, String> objectNames, Map<UUID, String> locationNames) {
        return new EvidenceResponse(
                e.getId(),
                e.getCaseId(),
                e.getObjectId(),
                e.getLocationId(),
                e.getMediaId(),      // ← новое
                e.getObjectId() != null ? objectNames.get(e.getObjectId()) : null,
                e.getLocationId() != null ? locationNames.get(e.getLocationId()) : null,
                e.getTitle(),
                e.getDescription(),
                e.getContentText(),
                e.getEvidenceType(),
                e.getImportance(),
                e.getSortOrder(),
                e.getCreatedAt(),
                e.getUpdatedAt()
        );
    }
}