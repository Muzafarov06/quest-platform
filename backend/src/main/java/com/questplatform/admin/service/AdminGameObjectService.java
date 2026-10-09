package com.questplatform.admin.service;

import com.questplatform.admin.dto.CreateGameObjectRequest;
import com.questplatform.admin.dto.UpdateGameObjectRequest;
import com.questplatform.common.exception.ResourceNotFoundException;
import com.questplatform.locations.repository.LocationRepository;
import com.questplatform.objects.entity.GameObject;
import com.questplatform.objects.repository.GameObjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class AdminGameObjectService {

    private final GameObjectRepository gameObjectRepository;
    private final LocationRepository locationRepository;

    public AdminGameObjectService(GameObjectRepository gameObjectRepository,
                                  LocationRepository locationRepository) {
        this.gameObjectRepository = gameObjectRepository;
        this.locationRepository = locationRepository;
    }

    @Transactional(readOnly = true)
    public List<GameObject> listByLocation(UUID locationId) {
        if (!locationRepository.existsById(locationId)) {
            throw new ResourceNotFoundException("Локация не найдена: " + locationId);
        }
        return gameObjectRepository.findByLocationIdOrderBySortOrderAscNameAsc(locationId);
    }

    @Transactional(readOnly = true)
    public GameObject getById(UUID id) {
        return gameObjectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Объект не найден: " + id));
    }

    @Transactional
    public GameObject create(UUID locationId, CreateGameObjectRequest req) {
        if (!locationRepository.existsById(locationId)) {
            throw new ResourceNotFoundException("Локация не найдена: " + locationId);
        }

        GameObject o = new GameObject();
        o.setLocationId(locationId);
        o.setName(req.name());
        o.setDescription(req.description());
        o.setObjectType(req.objectType());
        o.setState(req.state());
        o.setMediaId(req.mediaId());
        o.setSortOrder(req.sortOrder() != null ? req.sortOrder() : 0);
        o.setRenderLayer(req.renderLayer() != null ? req.renderLayer() : (short) 0);
        o.setWalkable(req.walkable() != null ? req.walkable() : false);
        return gameObjectRepository.save(o);
    }

    @Transactional
    public GameObject update(UUID id, UpdateGameObjectRequest req) {
        GameObject o = getById(id);
        o.setName(req.name());
        o.setDescription(req.description());
        o.setObjectType(req.objectType());
        o.setState(req.state());
        o.setMediaId(req.mediaId());
        o.setSortOrder(req.sortOrder());

        if (req.posX() != null) o.setPosX(req.posX());
        if (req.posY() != null) o.setPosY(req.posY());
        if (req.sceneScale() != null) o.setSceneScale(clampScale(req.sceneScale()));
        if (req.sceneRotation() != null) o.setSceneRotation(normalizeRotation(req.sceneRotation()));

        if (req.renderLayer() != null) o.setRenderLayer(req.renderLayer());
        if (req.walkable() != null) o.setWalkable(req.walkable());

        return gameObjectRepository.save(o);
    }

    @Transactional
    public GameObject updateTransform(UUID id, Float posX, Float posY,
                                      Float scale, Float rotation) {
        GameObject o = getById(id);
        if (posX != null) o.setPosX(posX);
        if (posY != null) o.setPosY(posY);
        if (scale != null) o.setSceneScale(clampScale(scale));
        if (rotation != null) o.setSceneRotation(normalizeRotation(rotation));
        return gameObjectRepository.save(o);
    }

    @Transactional
    public void delete(UUID id) {
        GameObject o = getById(id);
        gameObjectRepository.delete(o);
    }

    private static float clampScale(float s) {
        if (s < 0.1f) return 0.1f;
        if (s > 10f) return 10f;
        return s;
    }

    private static float normalizeRotation(float r) {
        while (r > 180f) r -= 360f;
        while (r < -180f) r += 360f;
        return r;
    }
}