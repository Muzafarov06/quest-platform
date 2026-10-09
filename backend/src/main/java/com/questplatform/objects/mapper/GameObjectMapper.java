package com.questplatform.objects.mapper;

import com.questplatform.objects.dto.GameObjectResponse;
import com.questplatform.objects.entity.GameObject;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class GameObjectMapper {

    public GameObjectResponse toResponse(GameObject o) {
        if (o == null) return null;
        return new GameObjectResponse(
                o.getId(),
                o.getLocationId(),
                o.getMediaId(),
                o.getName(),
                o.getDescription(),
                o.getObjectType(),
                o.getState(),
                o.getSortOrder(),
                o.getPosX(),
                o.getPosY(),
                o.getSceneScale(),
                o.getSceneRotation(),
                o.getRenderLayer(),
                o.isWalkable(),
                o.getCreatedAt(),
                o.getUpdatedAt()
        );
    }

    public List<GameObjectResponse> toResponseList(List<GameObject> objects) {
        return objects.stream().map(this::toResponse).toList();
    }
}