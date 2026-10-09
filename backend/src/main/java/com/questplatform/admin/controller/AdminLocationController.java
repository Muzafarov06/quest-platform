package com.questplatform.admin.controller;

import com.questplatform.admin.dto.CreateLocationRequest;
import com.questplatform.admin.dto.DeleteInfoResponse;
import com.questplatform.admin.dto.LocationSceneResponse;
import com.questplatform.admin.dto.TransformRequest;
import com.questplatform.admin.dto.UpdateLocationRequest;
import com.questplatform.admin.dto.UpdateMapPositionRequest;
import com.questplatform.admin.service.AdminGameObjectService;
import com.questplatform.admin.service.AdminLocationConnectionService;
import com.questplatform.admin.service.AdminLocationService;
import com.questplatform.locations.dto.LocationResponse;
import com.questplatform.locations.entity.Location;
import com.questplatform.locations.mapper.LocationConnectionMapper;
import com.questplatform.locations.mapper.LocationMapper;
import com.questplatform.objects.mapper.GameObjectMapper;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminLocationController {

    private final AdminLocationService adminLocationService;
    private final LocationMapper locationMapper;
    private final AdminGameObjectService adminGameObjectService;
    private final AdminLocationConnectionService adminLocationConnectionService;
    private final GameObjectMapper gameObjectMapper;
    private final LocationConnectionMapper locationConnectionMapper;

    public AdminLocationController(AdminLocationService adminLocationService,
                                   LocationMapper locationMapper,
                                   AdminGameObjectService adminGameObjectService,
                                   AdminLocationConnectionService adminLocationConnectionService,
                                   GameObjectMapper gameObjectMapper,
                                   LocationConnectionMapper locationConnectionMapper) {
        this.adminLocationService = adminLocationService;
        this.locationMapper = locationMapper;
        this.adminGameObjectService = adminGameObjectService;
        this.adminLocationConnectionService = adminLocationConnectionService;
        this.gameObjectMapper = gameObjectMapper;
        this.locationConnectionMapper = locationConnectionMapper;
    }

    @GetMapping("/cases/{caseId}/locations")
    public ResponseEntity<List<LocationResponse>> listByCase(@PathVariable UUID caseId) {
        List<Location> locations = adminLocationService.getByCaseId(caseId);
        return ResponseEntity.ok(locationMapper.toResponseList(locations));
    }

    @GetMapping("/locations/{id}")
    public ResponseEntity<LocationResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(locationMapper.toResponse(adminLocationService.getById(id)));
    }

    @GetMapping("/locations/{id}/scene")
    public ResponseEntity<LocationSceneResponse> getScene(@PathVariable UUID id) {
        Location location = adminLocationService.getById(id);
        var objects = adminGameObjectService.listByLocation(id);
        var connections = adminLocationConnectionService.getFrom(id);

        return ResponseEntity.ok(new LocationSceneResponse(
                locationMapper.toResponse(location),
                gameObjectMapper.toResponseList(objects),
                locationConnectionMapper.toResponseList(connections)
        ));
    }

    @PostMapping("/cases/{caseId}/locations")
    public ResponseEntity<LocationResponse> create(
            @PathVariable UUID caseId,
            @Valid @RequestBody CreateLocationRequest req
    ) {
        Location created = adminLocationService.create(caseId, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(locationMapper.toResponse(created));
    }

    @PutMapping("/locations/{id}")
    public ResponseEntity<LocationResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateLocationRequest req
    ) {
        Location updated = adminLocationService.update(id, req);
        return ResponseEntity.ok(locationMapper.toResponse(updated));
    }

    /** PATCH только координат карточки на карте дела. */
    @PatchMapping("/locations/{id}/map-position")
    public ResponseEntity<LocationResponse> updateMapPosition(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateMapPositionRequest req
    ) {
        Location updated = adminLocationService.updateMapPosition(
                id, req.mapX(), req.mapY());
        return ResponseEntity.ok(locationMapper.toResponse(updated));
    }

    /** PATCH позиции/масштаба/поворота под-локации на сцене родителя. */
    @PatchMapping("/locations/{id}/transform")
    public ResponseEntity<LocationResponse> updateTransform(
            @PathVariable UUID id,
            @Valid @RequestBody TransformRequest req
    ) {
        Location updated = adminLocationService.updateTransform(
                id, req.posX(), req.posY(), req.scale(), req.rotation());
        return ResponseEntity.ok(locationMapper.toResponse(updated));
    }

    /**
     * Информация о зависимостях локации перед удалением.
     * Что удалится, что помешает.
     */
    @GetMapping("/locations/{id}/delete-info")
    public ResponseEntity<DeleteInfoResponse> deleteInfo(@PathVariable UUID id) {
        return ResponseEntity.ok(adminLocationService.getDeleteInfo(id));
    }

    @DeleteMapping("/locations/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        adminLocationService.delete(id);
        return ResponseEntity.noContent().build();
    }
}