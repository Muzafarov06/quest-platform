package com.questplatform.admin.controller;

import com.questplatform.admin.dto.CreateGameObjectRequest;
import com.questplatform.admin.dto.TransformRequest;
import com.questplatform.admin.dto.UpdateGameObjectRequest;
import com.questplatform.admin.service.AdminGameObjectService;
import com.questplatform.objects.dto.GameObjectResponse;
import com.questplatform.objects.entity.GameObject;
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
public class AdminGameObjectController {

    private final AdminGameObjectService service;
    private final GameObjectMapper mapper;

    public AdminGameObjectController(AdminGameObjectService service, GameObjectMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @GetMapping("/locations/{locationId}/objects")
    public ResponseEntity<List<GameObjectResponse>> listByLocation(@PathVariable UUID locationId) {
        List<GameObject> objects = service.listByLocation(locationId);
        return ResponseEntity.ok(mapper.toResponseList(objects));
    }

    @GetMapping("/objects/{id}")
    public ResponseEntity<GameObjectResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(mapper.toResponse(service.getById(id)));
    }

    @PostMapping("/locations/{locationId}/objects")
    public ResponseEntity<GameObjectResponse> create(
            @PathVariable UUID locationId,
            @Valid @RequestBody CreateGameObjectRequest req
    ) {
        GameObject created = service.create(locationId, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(mapper.toResponse(created));
    }

    @PutMapping("/objects/{id}")
    public ResponseEntity<GameObjectResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateGameObjectRequest req
    ) {
        return ResponseEntity.ok(mapper.toResponse(service.update(id, req)));
    }

    /** Быстрый PATCH позиции/масштаба/поворота маркера на сцене. */
    @PatchMapping("/objects/{id}/transform")
    public ResponseEntity<GameObjectResponse> updateTransform(
            @PathVariable UUID id,
            @Valid @RequestBody TransformRequest req
    ) {
        GameObject updated = service.updateTransform(
                id, req.posX(), req.posY(), req.scale(), req.rotation());
        return ResponseEntity.ok(mapper.toResponse(updated));
    }

    @DeleteMapping("/objects/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}