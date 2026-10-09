package com.questplatform.locations.controller;

import com.questplatform.locations.dto.LocationResponse;
import com.questplatform.locations.entity.Location;
import com.questplatform.locations.mapper.LocationMapper;
import com.questplatform.locations.service.LocationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * REST-контроллер локаций.
 *
 * <p>Все endpoint'ы требуют JWT.</p>
 */
@RestController
public class LocationController {

    private final LocationService locationService;
    private final LocationMapper locationMapper;

    public LocationController(LocationService locationService, LocationMapper locationMapper) {
        this.locationService = locationService;
        this.locationMapper = locationMapper;
    }

    /**
     * Все локации кейса.
     *
     * <p>404 если кейс не существует.</p>
     */
    @GetMapping("/api/cases/{caseId}/locations")
    public ResponseEntity<List<LocationResponse>> listByCase(@PathVariable UUID caseId) {
        List<Location> locations = locationService.getByCaseId(caseId);
        return ResponseEntity.ok(locationMapper.toResponseList(locations));
    }

    /**
     * Локация по ID.
     *
     * <p>404 если не найдена.</p>
     */
    @GetMapping("/api/locations/{id}")
    public ResponseEntity<LocationResponse> getById(@PathVariable UUID id) {
        Location l = locationService.getById(id);
        return ResponseEntity.ok(locationMapper.toResponse(l));
    }
}