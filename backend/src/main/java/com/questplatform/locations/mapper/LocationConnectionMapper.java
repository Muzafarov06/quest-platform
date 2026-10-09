package com.questplatform.locations.mapper;

import com.questplatform.locations.dto.LocationConnectionResponse;
import com.questplatform.locations.entity.LocationConnection;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class LocationConnectionMapper {

    public LocationConnectionResponse toResponse(LocationConnection c) {
        if (c == null) {
            return null;
        }
        return new LocationConnectionResponse(
                c.getId(),
                c.getCaseId(),
                c.getFromLocationId(),
                c.getToLocationId(),
                c.getLabel(),
                c.getSortOrder(),
                c.getPosX(),
                c.getPosY(),
                c.getCreatedAt(),
                c.getUpdatedAt()
        );
    }

    public List<LocationConnectionResponse> toResponseList(List<LocationConnection> connections) {
        return connections.stream()
                .map(this::toResponse)
                .toList();
    }
}