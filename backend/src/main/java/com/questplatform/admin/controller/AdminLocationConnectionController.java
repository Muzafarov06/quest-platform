package com.questplatform.admin.controller;

import com.questplatform.admin.dto.CreateConnectionRequest;
import com.questplatform.admin.dto.UpdateConnectionRequest;
import com.questplatform.admin.service.AdminLocationConnectionService;
import com.questplatform.locations.dto.LocationConnectionResponse;
import com.questplatform.locations.entity.LocationConnection;
import com.questplatform.locations.mapper.LocationConnectionMapper;
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
public class AdminLocationConnectionController {

    private final AdminLocationConnectionService service;
    private final LocationConnectionMapper mapper;

    public AdminLocationConnectionController(AdminLocationConnectionService service,
                                             LocationConnectionMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @GetMapping("/locations/{locationId}/connections")
    public ResponseEntity<List<LocationConnectionResponse>> listFrom(@PathVariable UUID locationId) {
        List<LocationConnection> connections = service.getFrom(locationId);
        return ResponseEntity.ok(mapper.toResponseList(connections));
    }

    @PostMapping("/locations/{locationId}/connections")
    public ResponseEntity<LocationConnectionResponse> create(
            @PathVariable UUID locationId,
            @Valid @RequestBody CreateConnectionRequest req
    ) {
        LocationConnection created = service.create(locationId, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(mapper.toResponse(created));
    }

    /** Обновить переход — метка, порядок, координаты на сцене. */
    @PatchMapping("/connections/{id}")
    public ResponseEntity<LocationConnectionResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateConnectionRequest req
    ) {
        LocationConnection updated = service.update(id, req);
        return ResponseEntity.ok(mapper.toResponse(updated));
    }

    @DeleteMapping("/connections/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}