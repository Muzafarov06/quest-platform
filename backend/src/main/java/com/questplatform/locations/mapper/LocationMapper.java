package com.questplatform.locations.mapper;

import com.questplatform.locations.dto.LocationResponse;
import com.questplatform.locations.entity.Location;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class LocationMapper {

    public LocationResponse toResponse(Location l) {
        if (l == null) {
            return null;
        }
        return new LocationResponse(
                l.getId(),
                l.getCaseId(),
                l.getParentId(),
                l.getMediaId(),
                l.getPreviewMediaId(),
                l.getMapMediaId(),
                l.getName(),
                l.getDescription(),
                l.getLocationType(),
                l.getSortOrder(),
                l.getEntryX(),
                l.getEntryY(),
                l.getDiscoveryMode(),
                l.getDiscoveryTargetId(),
                l.getDiscoveryHint(),
                l.getMapX(),
                l.getMapY(),
                l.getSceneScale(),
                l.getSceneRotation(),
                l.getCreatedAt(),
                l.getUpdatedAt()
        );
    }

    public List<LocationResponse> toResponseList(List<Location> locations) {
        return locations.stream()
                .map(this::toResponse)
                .toList();
    }
}