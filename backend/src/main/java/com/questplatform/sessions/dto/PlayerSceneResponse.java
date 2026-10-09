package com.questplatform.sessions.dto;

import com.questplatform.engine.dto.CharacterResponse;
import com.questplatform.locations.dto.LocationConnectionResponse;
import com.questplatform.locations.dto.LocationResponse;
import com.questplatform.objects.dto.GameObjectResponse;

import java.util.List;

/**
 * Сцена локации для игрока.
 *
 * Отличается от админского {@code LocationSceneResponse}:
 *   • есть персонажи;
 *   • есть под-локации (открытые);
 *   • переходы отфильтрованы — только к открытым локациям.
 */
public record PlayerSceneResponse(
        LocationResponse location,
        List<GameObjectResponse> objects,
        List<CharacterResponse> characters,
        List<LocationConnectionResponse> connections,
        List<LocationResponse> subLocations
) {
}