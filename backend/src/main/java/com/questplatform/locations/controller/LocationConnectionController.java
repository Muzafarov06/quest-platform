package com.questplatform.locations.controller;

import com.questplatform.locations.dto.LocationConnectionResponse;
import com.questplatform.locations.entity.LocationConnection;
import com.questplatform.locations.mapper.LocationConnectionMapper;
import com.questplatform.locations.service.LocationConnectionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
public class LocationConnectionController {

    private final LocationConnectionService connectionService;
    private final LocationConnectionMapper connectionMapper;

    public LocationConnectionController(LocationConnectionService connectionService,
                                        LocationConnectionMapper connectionMapper) {
        this.connectionService = connectionService;
        this.connectionMapper = connectionMapper;
    }

    /** Переходы из локации. */
    @GetMapping("/api/locations/{locationId}/connections")
    public ResponseEntity<List<LocationConnectionResponse>> listFrom(@PathVariable UUID locationId) {
        List<LocationConnection> connections = connectionService.getByFromLocationId(locationId);
        return ResponseEntity.ok(connectionMapper.toResponseList(connections));
    }
}