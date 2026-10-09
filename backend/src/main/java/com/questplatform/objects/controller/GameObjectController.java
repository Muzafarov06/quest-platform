package com.questplatform.objects.controller;

import com.questplatform.objects.dto.GameObjectResponse;
import com.questplatform.objects.entity.GameObject;
import com.questplatform.objects.mapper.GameObjectMapper;
import com.questplatform.objects.service.GameObjectService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
public class GameObjectController {

    private final GameObjectService gameObjectService;
    private final GameObjectMapper gameObjectMapper;

    public GameObjectController(GameObjectService gameObjectService, GameObjectMapper gameObjectMapper) {
        this.gameObjectService = gameObjectService;
        this.gameObjectMapper = gameObjectMapper;
    }

    /**
     * Объекты в локации.
     */
    @GetMapping("/api/locations/{locationId}/objects")
    public ResponseEntity<List<GameObjectResponse>> listByLocation(@PathVariable UUID locationId) {
        List<GameObject> objects = gameObjectService.getByLocationId(locationId);
        return ResponseEntity.ok(gameObjectMapper.toResponseList(objects));
    }

    /**
     * Объект по ID.
     */
    @GetMapping("/api/objects/{id}")
    public ResponseEntity<GameObjectResponse> getById(@PathVariable UUID id) {
        GameObject o = gameObjectService.getById(id);
        return ResponseEntity.ok(gameObjectMapper.toResponse(o));
    }
}